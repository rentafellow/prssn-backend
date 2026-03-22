
import express from "express";
import { getUnverifiedUsers, verifyUser, createAdmin, getAllAdmins, updateAdmin, deleteAdmin, getDashboardStats, getSuperAdminAnalytics, getUserDetails, getAllUsers, deleteUser, verifyAdmin, getAllPayments } from "../controllers/admin.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// User Verification (Admins)
router.get("/unverified", authMiddleware, getUnverifiedUsers);
router.put("/verify/:id", authMiddleware, verifyUser);
router.get("/user/:id", authMiddleware, getUserDetails);
router.get("/stats", authMiddleware, getDashboardStats);

// Super Admin Routes
router.post("/create-admin", authMiddleware, createAdmin);
router.get("/admins", authMiddleware, getAllAdmins);
router.put("/admin/:id", authMiddleware, updateAdmin);
router.delete("/admin/:id", authMiddleware, deleteAdmin);
router.put("/verify-admin/:id", authMiddleware, verifyAdmin);
router.get("/super-stats", authMiddleware, getSuperAdminAnalytics);
router.get("/all-users", authMiddleware, getAllUsers);
router.delete("/user/:id", authMiddleware, deleteUser);
router.get("/payments", authMiddleware, getAllPayments);

export default router;
