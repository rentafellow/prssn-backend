
import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
        const hours = durationMap[booking.duration] || 1; // Default to 1 hour if unknown
        const amount = booking.pricePerHour * hours;
        
        // Stripe expects amount in smallest currency unit (e.g., paise for INR)
        // Ensure checks for minimum amount (Stripe minimum is usually around $0.50 USD equivalent ~ ₹40)
        const amountInPaise = Math.round(amount * 100);

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPaise,
            currency: 'inr',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                bookingId: booking._id.toString(),
                requesterId: userId
            }
        });

        // Save the intent ID to the booking
        booking.stripePaymentIntentId = paymentIntent.id;
        booking.amountPaid = amount;
        await booking.save();

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            amount: amount
        });

    } catch (error) {
        console.error("Create Payment Intent Error:", error);
        res.status(500).json({ message: "Failed to create payment intent.", error: "Payment initialization failed." });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { paymentIntentId, bookingId } = req.body;
        
        if (!paymentIntentId || !bookingId) {
             return res.status(400).json({ message: "Payment Intent ID and Booking ID are required." });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: "Booking not found." });
            }

            if (booking.paymentStatus !== 'paid') {
                booking.paymentStatus = 'paid';
                booking.amountPaid = paymentIntent.amount / 100; // Convert back to main unit
                await booking.save();
            }

            res.status(200).json({ message: "Payment verified successfully.", booking });
        } else {
            res.status(400).json({ message: "Payment not successful yet.", status: paymentIntent.status });
        }

    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ message: "Failed to verify payment.", error: error.message });
    }
};
