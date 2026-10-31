import { Router } from "express";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  updateProductStatus,
} from "../controllers/product.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// List products (admin or staff with product.read, or customer reading active catalog items)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listProducts
);

// Get single product
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getProduct
);

// Create product (admin or staff with product.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.PRODUCT_CREATE),
  createProduct
);

// Update product (admin or staff with product.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  updateProduct
);

// Update product status
router.patch(
  "/:id/status",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  updateProductStatus
);

export default router;
