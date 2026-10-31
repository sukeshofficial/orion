import { Router } from "express";
import {
  listUsers,
  getUser,
  createInternalUser,
  updateInternalUserPermissions,
  updateUserStatus,
  getCatalog,
} from "../controllers/admin.controller.js";
import { authenticate, requireRole, requirePermission } from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router();

// ── All admin routes require a valid, active session ──────────────────────────
router.use(authenticate);

// ── Permission Catalog ────────────────────────────────────────────────────────
// Returns all recognized permissions, roles, and default role→permission mappings.
router.get(
  "/permissions/catalog",
  requireRole("admin"),
  getCatalog
);

// ── User Management ───────────────────────────────────────────────────────────
// List all users (admin only)
router.get(
  "/users",
  requireRole("admin"),
  listUsers
);

// Retrieve a specific user by ID (admin only)
router.get(
  "/users/:id",
  requireRole("admin"),
  getUser
);

// Enable or disable a user account (admin only)
router.patch(
  "/users/:id/status",
  requireRole("admin"),
  updateUserStatus
);

// ── Internal Staff Management ─────────────────────────────────────────────────
// Provision a new internal staff account (admin only)
router.post(
  "/internal-users",
  requireRole("admin"),
  requirePermission(PERMISSIONS.STAFF_CREATE),
  createInternalUser
);

// Update the explicit permission set of an internal staff member (admin only)
router.patch(
  "/internal-users/:id/permissions",
  requireRole("admin"),
  requirePermission(PERMISSIONS.STAFF_UPDATE),
  updateInternalUserPermissions
);

export default router;
