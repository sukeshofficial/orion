/**
 * Canonical Role Definitions
 * Reusable backend starter template canonical roles.
 * Legacy roles are mapped for backward compatibility.
 */

export const USER_ROLES = {
  ADMIN: "admin",
  INTERNAL_USER: "internal_user",
  USER: "user",
};

// Legacy role aliases mapped to canonical roles for backward compatibility
export const LEGACY_ROLE_MAP = {
  customer: USER_ROLES.USER,
  end_user: USER_ROLES.USER,
  internal_staff: USER_ROLES.INTERNAL_USER,
  admin: USER_ROLES.ADMIN,
  internal_user: USER_ROLES.INTERNAL_USER,
  user: USER_ROLES.USER,
};

/**
 * Normalizes any role (canonical or legacy) into its canonical representation.
 * @param {string} role
 * @returns {string}
 */
export const normalizeRole = (role) => {
  if (!role) return USER_ROLES.USER;
  const lower = String(role).toLowerCase().trim();
  return LEGACY_ROLE_MAP[lower] || lower;
};

/**
 * Checks if a role matches an allowed role, taking canonical normalization into account.
 * E.g., satisfiesRole("internal_staff", "internal_user") is true.
 * @param {string} userRole
 * @param {string} requiredRole
 * @returns {boolean}
 */
export const matchesRole = (userRole, requiredRole) => {
  const normUserRole = normalizeRole(userRole);
  const normRequiredRole = normalizeRole(requiredRole);
  return normUserRole === normRequiredRole;
};

export const ALL_ROLES = Object.values(USER_ROLES);
