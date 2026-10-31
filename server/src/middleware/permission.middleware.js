import { requirePermission } from "./auth.middleware.js";

/**
 * Dedicated Permission Authorization Middleware
 * Usage:
 *   router.get('/users', requirePermission('users.read'), handler);
 *   router.post('/users', requirePermission('users.create'), handler);
 */
export { requirePermission };
export default requirePermission;
