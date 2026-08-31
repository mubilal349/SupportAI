import express from "express";

import {
  getCustomerDashboard,
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
} from "../controllers/customerController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ==========================================
// DASHBOARD
// ==========================================

router.get("/dashboard", authenticateToken, getCustomerDashboard);

// ==========================================
// PROFILE
// ==========================================

router.get("/profile", authenticateToken, getCustomerProfile);

router.put(
  "/profile",
  authenticateToken,
  upload.single("avatar"),
  updateCustomerProfile,
);

// ==========================================
// PASSWORD
// ==========================================

router.put("/password", authenticateToken, changeCustomerPassword);

export default router;
