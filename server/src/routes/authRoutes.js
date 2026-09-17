import express from "express";

import {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import uploadAvatar from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =========================================================
   AUTH
========================================================= */

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

/* =========================================================
   PROFILE
========================================================= */

router.get("/profile", authenticateToken, getProfile);

router.put(
  "/profile",
  authenticateToken,
  uploadAvatar.single("avatar"),
  updateProfile,
);

/* =========================================================
   PASSWORD
========================================================= */

router.put("/change-password", authenticateToken, changePassword);

export default router;
