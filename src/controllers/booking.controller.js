
import Booking from '../models/Booking.js';
import User from '../models/User.js';

export const createBooking = async (req, res) => {
    try {
        const { companionId, message, duration, scheduledDate, startTime } = req.body;
        const requesterId = req.user.id;

        if (!companionId) {
            return res.status(400).json({ message: "Companion ID is required." });
        }

        if (requesterId === companionId) {
            return res.status(400).json({ message: "You cannot book yourself." });
        }

        if (!scheduledDate || !startTime) {
            return res.status(400).json({ message: "Date and Time are required." });
        }

        // Fetch companion
        const companion = await User.findById(companionId);
        if (!companion || companion.role !== 'companion') {
             return res.status(404).json({ message: "Companion not found." });
        }

        // 1. Validate Day Availability
        const bookingDayIndex = new Date(scheduledDate).getDay(); // 0 = Sunday
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[bookingDayIndex];

        if (!companion.availability || !companion.availability[dayName]) {
            return res.status(400).json({ message: `Companion is not available on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}s.` });
        }

        // 2. Validate Time Availability
        if (companion.startTime && companion.endTime) {
            // Simple string comparison for HH:MM works if format is consistent (09:00 vs 9:00 might fail, assuming typical HH:MM)
            // Ideally parse to minutes
            const toMinutes = (timeStr) => {
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + m;
            };

            const bookingMin = toMinutes(startTime);
            const startMin = toMinutes(companion.startTime);
            const endMin = toMinutes(companion.endTime);

            if (bookingMin < startMin || bookingMin > endMin) {
                return res.status(400).json({ 
                    message: `Companion is only available between ${companion.startTime} and ${companion.endTime}.` 
                });
            }
        }

        const pricePerHour = companion.pricePerHour;
        if (!pricePerHour) {
            return res.status(400).json({ message: "Companion does not have a price set." });
        }

        const newBooking = new Booking({
            requesterId,
            companionId,
            pricePerHour, 
            duration: duration || '60',
            message: message || "I would like to request your presence.",
            startTime: startTime,
            scheduledDate: scheduledDate,
            status: 'pending'
        });

        await newBooking.save();

        res.status(201).json({ message: "Booking request sent successfully!", booking: newBooking });
    } catch (error) {
        console.error("Create Booking Error:", error);
        res.status(500).json({ message: "Failed to create booking request.", details: error.message });
    }
};

export const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find bookings where user is requester
        const bookings = await Booking.find({ requesterId: userId })
            .populate('companionId', 'fullName profilePhotoUrl pricePerHour')
            .sort({ createdAt: -1 });
        
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Get User Bookings Error:", error);
        res.status(500).json({ message: "Failed to fetch bookings." });
    }
};

export const getCompanionBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find bookings where user is companion (receiver)
        const bookings = await Booking.find({ companionId: userId })
            .populate('requesterId', 'fullName profilePhotoUrl phoneNumber')
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Get Companion Bookings Error:", error);
        res.status(500).json({ message: "Failed to fetch bookings." });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Verify that the user is the companion for this booking
        if (booking.companionId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to update this booking." });
        }

        if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({ message: `Booking ${status} successfully.`, booking });
    } catch (error) {
        console.error("Update Booking Status Error:", error);
        res.status(500).json({ message: "Failed to update booking status." });
    }
};

export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id)
            .populate('requesterId', 'fullName profilePhotoUrl')
            .populate('companionId', 'fullName profilePhotoUrl');

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        res.status(200).json(booking);
    } catch (error) {
        console.error("Get Booking Error:", error);
        res.status(500).json({ message: "Failed to fetch booking details." });
    }
};
