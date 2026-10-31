/**
 * Canonical Role Definitions
 *
 * Canonical values stored in the database:  admin | internal_user | user
 * Human-facing / legacy aliases:            internal_staff | customer | end_user
 *
 * The LEGACY_ROLE_MAP normalizes any alias to its canonical counterpart.
 * Always use USER_ROLES.* constants in code — never raw strings.
 */

export const USER_ROLES = {
  ADMIN:         "admin",
  INTERNAL_USER: "internal_user",   // canonical for internal staff
  USER:          "user",            // canonical for customers / end-users
};

/**
 * All values that the database role field may legally hold.
 * Includes both canonical values and accepted legacy aliases.
 */
export const ALL_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.INTERNAL_USER,
  USER_ROLES.USER,
  // Legacy / human-facing aliases stored by older records or created via legacy API
  "internal_staff",
  "customer",
  "end_user",
];

/**
 * Maps every recognized role string (canonical or legacy) to its canonical form.
 * Used by normalizeRole() and matchesRole().
 */
export const LEGACY_ROLE_MAP = {
  // Canonical → self
  admin:         USER_ROLES.ADMIN,
  internal_user: USER_ROLES.INTERNAL_USER,
  user:          USER_ROLES.USER,

  // Legacy aliases
  internal_staff: USER_ROLES.INTERNAL_USER,
  customer:       USER_ROLES.USER,
  end_user:       USER_ROLES.USER,
};

/**
 * Normalizes any role (canonical or legacy alias) to its canonical string.
 * Returns USER_ROLES.USER for unknown/missing values.
 *
 * @param {string} role
 * @returns {string} canonical role
 */
export const normalizeRole = (role) => {
  if (!role) return USER_ROLES.USER;
  const lower = String(role).toLowerCase().trim();
  return LEGACY_ROLE_MAP[lower] || lower;
};

/**
 * Returns true when a user's role satisfies a required role, accounting for
 * canonical normalization.  E.g. matchesRole("internal_staff", "internal_user") → true.
 *
 * @param {string} userRole     - role value from req.user.role
 * @param {string} requiredRole - role to test against (canonical or alias)
 * @returns {boolean}
 */
export const matchesRole = (userRole, requiredRole) => {
  return normalizeRole(userRole) === normalizeRole(requiredRole);
};
