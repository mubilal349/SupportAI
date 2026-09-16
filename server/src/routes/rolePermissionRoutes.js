import express from "express";

import {
  getRolePermissions,
  getSingleRolePermissions,
  updateRolePermissions,
  getMyPermissions,
  getUsersForPermissions,
  getUserPermissions,
  updateUserPermissions,
  resetUserPermissions,
} from "../controllers/rolePermissionController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ======================================================
// GET CURRENT USER PERMISSIONS
// ======================================================
// GET /api/role-permissions/me
//
// Available to:
// - Admin
// - Agent
// - Customer
//
// IMPORTANT:
// This route must come BEFORE /:role
// ======================================================

router.get("/me", authenticateToken, getMyPermissions);

// ======================================================
// GET ALL ROLE PERMISSIONS
// ======================================================
// GET /api/role-permissions
//
// Admin only
//
// Returns:
// - Admin permissions
// - Agent permissions
// - Customer permissions
// - Permission definitions
// ======================================================

router.get("/", authenticateToken, adminOnly, getRolePermissions);

// ======================================================
// GET USERS FOR INDIVIDUAL PERMISSIONS
// ======================================================
// GET /api/role-permissions/users?role=customer
// GET /api/role-permissions/users?role=agent
//
// Admin only
//
// Used by AdminRolePermissions.jsx to display
// individual customers and agents.
// ======================================================

router.get("/users", authenticateToken, adminOnly, getUsersForPermissions);

// ======================================================
// GET INDIVIDUAL USER PERMISSIONS
// ======================================================
// GET /api/role-permissions/users/:userId
//
// Admin only
//
// Returns:
// - User information
// - Role permissions
// - Effective permissions
// - Whether user has custom permissions
// ======================================================

router.get("/users/:userId", authenticateToken, adminOnly, getUserPermissions);

// ======================================================
// UPDATE INDIVIDUAL USER PERMISSIONS
// ======================================================
// PATCH /api/role-permissions/users/:userId
//
// Admin only
//
// Example body:
//
// {
//   "permissions": [
//     "dashboard.view",
//     "tickets.view",
//     "tickets.create",
//     "tickets.reply"
//   ]
// }
//
// This changes permissions for ONLY this user.
// ======================================================

router.patch(
  "/users/:userId",
  authenticateToken,
  adminOnly,
  updateUserPermissions,
);

// ======================================================
// RESET INDIVIDUAL USER PERMISSIONS
// ======================================================
// DELETE /api/role-permissions/users/:userId
//
// Admin only
//
// Sets:
//
// permissions = null
//
// The user then inherits permissions from
// their role again.
// ======================================================

router.delete(
  "/users/:userId",
  authenticateToken,
  adminOnly,
  resetUserPermissions,
);

// ======================================================
// GET SINGLE ROLE PERMISSIONS
// ======================================================
// GET /api/role-permissions/:role
//
// Admin only
//
// Examples:
//
// /api/role-permissions/admin
// /api/role-permissions/agent
// /api/role-permissions/customer
//
// IMPORTANT:
// This route must come AFTER /users routes.
// ======================================================

router.get("/:role", authenticateToken, adminOnly, getSingleRolePermissions);

// ======================================================
// UPDATE ROLE PERMISSIONS
// ======================================================
// PATCH /api/role-permissions/:role
//
// Admin only
//
// Examples:
//
// PATCH /api/role-permissions/admin
// PATCH /api/role-permissions/agent
// PATCH /api/role-permissions/customer
//
// These are ROLE DEFAULT permissions.
//
// They do NOT overwrite individual custom
// permissions already assigned to users.
// ======================================================

router.patch("/:role", authenticateToken, adminOnly, updateRolePermissions);

// ======================================================
// EXPORT ROUTER
// ======================================================

export default router;
