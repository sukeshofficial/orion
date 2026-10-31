import { Router } from "express";
import {
  listUsers,
  getUser,
  createInternalUser,
  updateInternalUserPermissions,
  updateUserStatus,
  getCatalog,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router();

// All admin routes require authentication and admin role (or specific permissions)
router.use(authenticate);

// RBAC & Permission Catalog
router.get("/permissions/catalog", requireRole("admin"), getCatalog);

// User Management
router.get(
  "/users",
  requireRole("admin"),
  listUsers
);

router.get(
  "/users/:id",
  requireRole("admin"),
  getUser
);

router.patch(
  "/users/:id/status",
  requireRole("admin"),
  updateUserStatus
);

// Internal User Management
router.post(
  "/internal-users",
  requireRole("admin"),
  createInternalUser
);

router.patch(
  "/internal-users/:id/permissions",
  requireRole("admin"),
  updateInternalUserPermissions
);

export default router;
