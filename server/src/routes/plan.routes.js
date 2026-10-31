import { Router } from "express";
import {
  createPlan,
  listPlans,
  getPlan,
  updatePlan,
  updatePlanStatus,
} from "../controllers/plan.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// List plans (admin or staff with plan.read, or customer reading active plans)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listPlans
);

// Get single plan
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getPlan
);

// Create plan (admin or staff with plan.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.PLAN_CREATE),
  createPlan
);

// Update plan (admin or staff with plan.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.PLAN_UPDATE),
  updatePlan
);

// Update plan status
router.patch(
  "/:id/status",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.PLAN_UPDATE),
  updatePlanStatus
);

export default router;
