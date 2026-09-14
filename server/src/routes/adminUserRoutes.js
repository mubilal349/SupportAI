import express from "express";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

import {
  getUsers,
  getUser,
  updateUser,
  createAdminUser,
  updateUserStatus,
  deleteUser,
  getUserStats,
  getAdminUserTicketStats,
} from "../controllers/adminUserController.js";

const router = express.Router();

// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

router.use(authenticateToken, requireAdmin);

// ============================================================
// USER STATISTICS
// ============================================================

router.get("/stats", getUserStats);

// ============================================================
// USERS
// ============================================================

router.get("/", getUsers);

// CREATE USER

router.post("/", createAdminUser);

// ============================================================
// USER TICKET STATISTICS
// ============================================================

router.get("/:userId/ticket-stats", getAdminUserTicketStats);

// ============================================================
// USER DETAILS
// ============================================================

router.get("/:userId", getUser);

// ============================================================
// UPDATE USER
// ============================================================

router.put("/:userId", updateUser);

// ============================================================
// UPDATE USER STATUS
// ============================================================

router.patch("/:userId/status", updateUserStatus);

// ============================================================
// DELETE USER
// ============================================================

router.delete("/:userId", deleteUser);

export default router;
