
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Map userId from token to id if present, to standardize
      if (decoded.userId && !decoded.id) {
          decoded.id = decoded.userId;
      }
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}, User ID: ${socket.user.id}`);

    socket.on("join_room", async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
          socket.emit("error", "Booking not found");
          return;
        }

        // Check if the user is part of the booking
        const isParticipant =
          booking.requesterId.toString() === socket.user.id ||
          booking.companionId.toString() === socket.user.id;

        if (!isParticipant) {
          socket.emit("error", "Unauthorized access to booking chat");
          return;
        }

        if (booking.status !== "accepted") {
          socket.emit("error", "Chat is only available for accepted bookings");
          return;
        }

        socket.join(bookingId);
        console.log(`User ${socket.user.id} joined room ${bookingId}`);

        // Load previous messages
        const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
        socket.emit("previous_messages", messages);

      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", "Server error while joining room");
      }
    });

    socket.on("send_message", async ({ bookingId, message }) => {
      try {
        if (!message || !message.trim()) return;

        // Verify booking status again before saving
        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status !== 'accepted') {
             socket.emit("error", "Cannot send message. Booking is not active.");
             return;
        }

        const newMessage = new Message({
          bookingId,
          senderId: socket.user.id,
          content: message,
        });

        await newMessage.save();

        // Broadcast to the room
        io.to(bookingId).emit("receive_message", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", "Server error while sending message");
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export default initializeSocket;
