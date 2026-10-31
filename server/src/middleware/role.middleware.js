import { requireRole } from "./auth.middleware.js";

/**
 * Dedicated Role Authorization Middleware
 * Usage:
 *   router.get('/admin-area', requireRole('admin'), handler);
 *   router.get('/staff-area', requireRole('admin', 'internal_user'), handler);
 */
export { requireRole };
export default requireRole;
