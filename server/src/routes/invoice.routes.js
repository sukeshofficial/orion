import { Router } from "express";
import {
  generateInvoice,
  listInvoices,
  getInvoice,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  getInvoicePdf,
} from "../controllers/invoice.controller.js";
import { listPaymentsForInvoice } from "../controllers/payment.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// Generate invoice from due active subscription (Admin or Staff with invoice.create)
router.post(
  "/generate",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.INVOICE_CREATE),
  generateInvoice
);

// List invoices (Admin, Staff with invoice.read, or Customers reading their own)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listInvoices
);

// Get single invoice
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getInvoice
);

// Confirm invoice (Admin or Staff with invoice.create)
router.post(
  "/:id/confirm",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.INVOICE_CREATE),
  confirmInvoice
);

// Cancel invoice (Admin or Staff with invoice.create)
router.post(
  "/:id/cancel",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.INVOICE_CREATE),
  cancelInvoice
);

// Send invoice
router.post(
  "/:id/send",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.INVOICE_CREATE),
  sendInvoice
);

// Download invoice PDF (Admin, Staff, or Customer owner)
router.get(
  "/:id/pdf",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getInvoicePdf
);

// List payments for an invoice (Admin, Staff, or Customer owner)
router.get(
  "/:id/payments",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listPaymentsForInvoice
);

export default router;
