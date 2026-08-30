import express from "express";

import {
  getCustomerDashboard,
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
} from "../controllers/customerController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", authenticateToken, getCustomerDashboard);

// Profile
router.get("/profile", authenticateToken, getCustomerProfile);

router.put("/profile", authenticateToken, updateCustomerProfile);

// Password
router.put("/password", authenticateToken, changeCustomerPassword);

export default router;
