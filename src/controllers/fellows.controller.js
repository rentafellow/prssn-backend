

import User from '../models/User.js';

// Simple in-memory cache for companion listings
let companionsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all verified companions with pagination and caching
 */
export const getAllCompanions = async (req, res) => {
    try {
        // Check cache first
        const now = Date.now();
        if (companionsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
            return res.status(200).json(companionsCache);
        }

        // Pagination support (optional, for future use)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100; // Default to 100, but allow override
        const skip = (page - 1) * limit;

        // Optimized query with lean() for faster results
        const companions = await User.find({ 
            role: 'companion', 
            verificationStatus: 'verified' 
        })
        .select('username email profilePhotoUrl fullName description pricePerHour city area tags availability startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(); // Convert to plain JavaScript objects for better performance
        
        // Map to frontend structure
        const mapped = companions.map(f => ({
            id: f._id,
            userId: f._id,
            username: f.username,
            email: f.email,
            profilePhoto: f.profilePhotoUrl,
            fullName: f.fullName,
            description: f.description,
            pricePerHour: f.pricePerHour,
            city: f.city,
            area: f.area,
            tags: f.tags || [],
            availability: f.availability,
            monday_availability: f.availability?.monday,
            tuesday_availability: f.availability?.tuesday,
            wednesday_availability: f.availability?.wednesday,
            thursday_availability: f.availability?.thursday,
            friday_availability: f.availability?.friday,
            saturday_availability: f.availability?.saturday,
            sunday_availability: f.availability?.sunday,
            start_time: f.startTime,
            end_time: f.endTime
        }));

        // Update cache
        companionsCache = mapped;
        cacheTimestamp = now;

        res.status(200).json(mapped);
    } catch (error) {
        console.error('Error fetching companions:', error);
        res.status(500).json({ message: 'Server error fetching companions' });
    }
};

/**
 * Fetch a specific companion by ID
 */
export const getCompanionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id)
            .select('username email profilePhotoUrl fullName description pricePerHour city area tags availability startTime endTime verificationStatus role')
            .lean();

        if (!user || user.role !== 'companion' || user.verificationStatus !== 'verified') {
            return res.status(404).json({ message: 'Companion not found or not verified' });
        }
        
        res.status(200).json({
            ...user,
            id: user._id,
            userId: user._id,
            profilePhoto: user.profilePhotoUrl,
            monday_availability: user.availability?.monday,
            tuesday_availability: user.availability?.tuesday,
            wednesday_availability: user.availability?.wednesday,
            thursday_availability: user.availability?.thursday,
            friday_availability: user.availability?.friday,
            saturday_availability: user.availability?.saturday,
            sunday_availability: user.availability?.sunday,
            start_time: user.startTime,
            end_time: user.endTime,
            price_per_hour: user.pricePerHour
        });
    } catch (error) {
        console.error('Error fetching companion:', error);
        res.status(500).json({ message: 'Server error fetching companion' });
    }
};

/**
 * Search companions by name or description
 */
export const searchCompanions = async (req, res) => {
    try {
        const { query } = req.params;
        const regex = new RegExp(query, 'i');

        const companions = await User.find({
            role: 'companion',
            verificationStatus: 'verified',
            $or: [
                { fullName: regex },
                { username: regex },
                { description: regex },
                { tags: regex }
            ]
        })
        .select('username email profilePhotoUrl fullName description pricePerHour city area tags availability startTime endTime')
        .sort({ createdAt: -1 })
        .limit(50) // Limit search results to 50
        .lean();

        res.status(200).json(companions);
    } catch (error) {
        console.error('Error searching companions:', error);
        res.status(500).json({ message: 'Server error searching companions' });
    }
};
