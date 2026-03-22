
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createPaymentIntent = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id; // From auth middleware

        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Ensure the user requesting payment is the one who made the booking
        if (booking.requesterId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to pay for this booking." });
        }

        if (booking.status !== 'accepted') {
            return res.status(400).json({ message: "Booking must be accepted before payment." });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ message: "Booking is already paid." });
        }

        // Calculate amount
        const durationMap = {
            '30': 0.5,
            '60': 1,
            '90': 1.5
        };
        const hours = durationMap[booking.duration] || 1;
        const amount = booking.pricePerHour * hours;
        const amountInPaise = Math.round(amount * 100);

        // IDEMPOTENCY: If an order was already created for this booking, reuse it
        // This prevents duplicate orders if the user clicks Pay multiple times
        if (booking.razorpayOrderId) {
            try {
                const existingOrder = await razorpay.orders.fetch(booking.razorpayOrderId);
                if (existingOrder && existingOrder.status !== 'paid') {
                    return res.status(200).json({
                        orderId: existingOrder.id,
                        amount: existingOrder.amount,
                        currency: existingOrder.currency,
                    });
                }
            } catch (fetchErr) {
                // If fetch fails, fall through and create a new order
                console.warn("Could not fetch existing Razorpay order, creating new one:", fetchErr.message);
            }
        }

        // Create a new Razorpay Order
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: booking._id.toString(),
            notes: {
                bookingId: booking._id.toString(),
                requesterId: userId
            }
        };

        const order = await razorpay.orders.create(options);

        // Save the order ID to the booking
        booking.razorpayOrderId = order.id;
        await booking.save();

        res.status(200).json({
            orderId: order.id,
            amount: amountInPaise,
            currency: 'INR'
        });

    } catch (error) {
        console.error("Create Payment Intent Error:", error);
        res.status(500).json({ message: "Failed to create payment intent.", error: "Payment initialization failed." });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
            return res.status(400).json({ message: "Payment details and Booking ID are required." });
        }

        const body = razorpayOrderId + "|" + razorpayPaymentId;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment signature verification failed." });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Idempotent: If already marked paid (e.g., webhook already processed), just return success
        if (booking.paymentStatus === 'paid') {
            return res.status(200).json({ message: "Payment already verified.", booking });
        }

        // Fetch actual payment amount from Razorpay to store accurately
        const payment = await razorpay.payments.fetch(razorpayPaymentId);

        booking.paymentStatus = 'paid';
        booking.razorpayPaymentId = razorpayPaymentId;
        booking.razorpaySignature = razorpaySignature;
        booking.amountPaid = payment.amount / 100;
        await booking.save();

        res.status(200).json({ message: "Payment verified successfully.", booking });

    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ message: "Failed to verify payment.", error: error.message });
    }
};
