/**
 * Generic Ownership Authorization Utility
 * Reusable for any entity or resource in any application.
 * Prevents Insecure Direct Object Reference (IDOR) vulnerabilities.
 */

import { USER_ROLES, normalizeRole } from "../config/roles.js";

/**
 * Authorizes that the authenticated user owns the resource,
 * or possesses administrative override authority.
 *
 * @param {object} params
 * @param {string|object} params.resourceOwnerId - ID of the resource owner
 * @param {object} params.authenticatedUser - User attached by auth middleware
 * @param {boolean} [params.allowAdmin=true] - Whether admin role can bypass ownership
 * @param {boolean} [params.allowStaff=true] - Backward compatibility alias for internal users/staff
 * @param {string} [params.requiredPermission=null] - Optional permission allowing access
 * @returns {boolean} - Returns true if authorized, throws 401/403 Error otherwise
 */
export const authorizeOwnership = ({
  resourceOwnerId,
  authenticatedUser,
  allowAdmin = true,
  allowStaff = true,
  requiredPermission = null,
}) => {
  if (!authenticatedUser) {
    const error = new Error("Authentication required for resource access");
    error.statusCode = 401;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);

  // 1. Admin bypass if permitted
  if (allowAdmin && role === USER_ROLES.ADMIN) {
    return true;
  }

  // 2. Staff / internal user bypass for backward compatibility
  if (allowStaff && (role === USER_ROLES.INTERNAL_USER || authenticatedUser.role === "internal_staff")) {
    return true;
  }

  // 3. Permission-based bypass if permission provided and user has it
  if (requiredPermission) {
    const permissions = Array.isArray(authenticatedUser.permissions)
      ? authenticatedUser.permissions
      : [];
    if (permissions.includes(requiredPermission) || permissions.includes("*")) {
      return true;
    }
  }

  // 4. Exact owner check
  const normalizedOwnerId = resourceOwnerId?._id
    ? resourceOwnerId._id.toString()
    : resourceOwnerId?.toString?.() || String(resourceOwnerId || "");

  const authenticatedUserId = (authenticatedUser._id || authenticatedUser.id)?.toString?.();

  if (!normalizedOwnerId || !authenticatedUserId || normalizedOwnerId !== authenticatedUserId) {
    const error = new Error("Access denied: You do not have permission to access this resource");
    error.statusCode = 403;
    throw error;
  }

  return true;
};

/**
 * Filter builder to enforce ownership at the database query level.
 * Prevents unauthorized data access directly in MongoDB query criteria.
 *
 * @param {object} authenticatedUser - req.user
 * @param {object} [baseQuery={}] - Base query filter
 * @param {string} [ownerField="ownerId"] - Field name representing the owner
 * @param {object} [options={}] - { allowAdmin: true, allowStaff: true }
 * @returns {object} Query filter safe to pass to MongoDB
 */
export const buildOwnershipQuery = (
  authenticatedUser,
  baseQuery = {},
  ownerField = "ownerId",
  options = { allowAdmin: true, allowStaff: true }
) => {
  if (!authenticatedUser) {
    const error = new Error("Authentication required to build query filter");
    error.statusCode = 401;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);
  const userId = authenticatedUser._id || authenticatedUser.id;

  // Admin bypass
  if (options.allowAdmin && role === USER_ROLES.ADMIN) {
    return baseQuery;
  }

  // Internal staff bypass
  if (
    options.allowStaff &&
    (role === USER_ROLES.INTERNAL_USER || authenticatedUser.role === "internal_staff")
  ) {
    return baseQuery;
  }

  // Otherwise, strictly scope query to authenticated user's ID
  return {
    ...baseQuery,
    [ownerField]: userId,
  };
};
