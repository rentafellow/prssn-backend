import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBooking, updateBookingStatus } from '../../controllers/booking.controller.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';

// Mock models
vi.mock('../../models/Booking.js', () => {
  const BookingMock = function(data) {
    Object.assign(this, data || {});
    this.save = vi.fn().mockResolvedValue(true);
  };
  BookingMock.findById = vi.fn();
  BookingMock.find = vi.fn();
  return { default: BookingMock };
});

vi.mock('../../models/User.js', () => {
  return {
    default: {
      findById: vi.fn()
    }
  };
});

describe('Booking Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      user: { id: 'requesterId123' },
      params: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  describe('createBooking', () => {
    it('should return 400 if companionId is missing', async () => {
      req.body = { scheduledDate: '2026-10-10', startTime: '10:00' };
      
      await createBooking(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Companion ID') }));
    });

    it('should return 400 if user tries to book themselves', async () => {
      req.body = { companionId: 'requesterId123', scheduledDate: '2026-10-10', startTime: '10:00' };
      
      await createBooking(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "You cannot book yourself." });
    });

    it('should return 404 if companion is not found or not a companion role', async () => {
      req.body = { companionId: 'companion123', scheduledDate: '2026-10-10', startTime: '10:00' };
      User.findById.mockResolvedValue(null);
      
      await createBooking(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Companion not found." });
    });

    it('should return 400 if companion is not available on that day', async () => {
      // 2026-10-10 is a Saturday
      req.body = { companionId: 'companion123', scheduledDate: '2026-10-10', startTime: '10:00' };
      const companion = {
        _id: 'companion123',
        role: 'companion',
        pricePerHour: 100,
        availability: { saturday: false } // Not available Saturday
      };
      User.findById.mockResolvedValue(companion);
      
      await createBooking(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        message: expect.stringContaining('not available on Saturday') 
      }));
    });

    it('should return 201 on successful booking request', async () => {
      req.body = { companionId: 'companion123', scheduledDate: '2026-10-10', startTime: '10:00', duration: '60' };
      const companion = {
        _id: 'companion123',
        role: 'companion',
        pricePerHour: 1500,
        startTime: '08:00',
        endTime: '18:00',
        availability: { saturday: true }
      };
      User.findById.mockResolvedValue(companion);
      
      await createBooking(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Booking request sent successfully!",
        booking: expect.objectContaining({
          status: 'pending',
          companionId: 'companion123',
          requesterId: 'requesterId123'
        })
      }));
    });
  });

  describe('updateBookingStatus', () => {
    it('should return 403 if user is not the companion for this booking', async () => {
      req.params = { id: 'booking123' };
      req.body = { status: 'accepted' };
      req.user = { id: 'otherUser456' }; // User making the request
      
      const mockBooking = {
        _id: 'booking123',
        companionId: 'companion789', // Different companion
        status: 'pending',
        save: vi.fn()
      };
      
      Booking.findById.mockResolvedValue(mockBooking);
      
      await updateBookingStatus(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Not authorized to update this booking." });
    });
  });
});
