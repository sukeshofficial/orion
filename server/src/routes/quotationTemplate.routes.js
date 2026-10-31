import { Router } from "express";
import {
  createQuotationTemplate,
  listQuotationTemplates,
  getQuotationTemplate,
  updateQuotationTemplate,
} from "../controllers/quotationTemplate.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// List templates (Admin, Staff with quotation.read, or Users viewing available templates)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listQuotationTemplates
);

// Get template details
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getQuotationTemplate
);

// Create template (Admin or Staff with quotation.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.QUOTATION_CREATE),
  createQuotationTemplate
);

// Update template (Admin or Staff with quotation.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.QUOTATION_UPDATE),
  updateQuotationTemplate
);

export default router;
