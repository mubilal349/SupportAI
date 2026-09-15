import express from "express";

import {
  getRolePermissions,
  getSingleRolePermissions,
  updateRolePermissions,
  getMyPermissions,
} from "../controllers/rolePermissionController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ==========================================
// GET CURRENT USER PERMISSIONS
// ==========================================
// GET /api/role-permissions/me
//
// Available to:
// - Admin
// - Agent
// - Customer
//
// Used by ProtectedRoute to check the
// currently authenticated user's permissions.
// ==========================================

router.get("/me", authenticateToken, getMyPermissions);

// ==========================================
// GET ALL ROLE PERMISSIONS
// ==========================================
// GET /api/role-permissions
//
// Admin only
//
// Returns permissions for:
// - admin
// - agent
// - customer
// ==========================================

router.get("/", authenticateToken, adminOnly, getRolePermissions);

// ==========================================
// GET SINGLE ROLE PERMISSIONS
// ==========================================
// GET /api/role-permissions/:role
//
// Admin only
//
// Examples:
// /api/role-permissions/admin
// /api/role-permissions/agent
// /api/role-permissions/customer
// ==========================================

router.get("/:role", authenticateToken, adminOnly, getSingleRolePermissions);

// ==========================================
// UPDATE ROLE PERMISSIONS
// ==========================================
// PATCH /api/role-permissions/:role
//
// Admin only
//
// Examples:
// PATCH /api/role-permissions/admin
// PATCH /api/role-permissions/agent
// PATCH /api/role-permissions/customer
// ==========================================

router.patch("/:role", authenticateToken, adminOnly, updateRolePermissions);

export default router;
