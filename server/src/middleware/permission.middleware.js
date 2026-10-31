/**
 * Permission Authorization Middleware — Re-export Module
 *
 * Import requirePermission or its spec alias authorizePermission from here
 * to keep route files concise.
 *
 * Usage:
 *   import { requirePermission } from "../middleware/permission.middleware.js";
 *   router.get("/customers", authenticate, requirePermission(PERMISSIONS.CUSTOMER_READ), handler);
 */
import {
  requirePermission,
  authorizePermission,
} from "./auth.middleware.js";

export { requirePermission, authorizePermission };
export default requirePermission;
