/**
 * Role Authorization Middleware — Re-export Module
 *
 * Import requireRole or its spec alias authorizeRole from here
 * to keep route files concise.
 *
 * Usage:
 *   import { requireRole } from "../middleware/role.middleware.js";
 *   router.get("/admin-area", authenticate, requireRole("admin"), handler);
 *   router.get("/staff-area", authenticate, requireRole("admin", "internal_user"), handler);
 */
import {
  requireRole,
  authorizeRole,
} from "./auth.middleware.js";

export { requireRole, authorizeRole };
export default requireRole;
