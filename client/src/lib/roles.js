/**
 * Centralized Role Definitions & Normalization for ORION
 *
 * Canonical backend roles:
 * - admin:          System administrators
 * - internal_user:  Internal staff members
 * - user:           Customer / end-user portal accounts
 *
 * Legacy / UI aliases:
 * - internal_staff -> internal_user
 * - customer       -> user
 * - end_user       -> user
 * - staff          -> internal_user
 */

export const ROLES = Object.freeze({
  ADMIN: "admin",
  INTERNAL_USER: "internal_user",
  USER: "user",
})

export const LEGACY_ROLE_MAP = Object.freeze({
  admin: ROLES.ADMIN,
  internal_user: ROLES.INTERNAL_USER,
  internal_staff: ROLES.INTERNAL_USER,
  staff: ROLES.INTERNAL_USER,
  user: ROLES.USER,
  customer: ROLES.USER,
  end_user: ROLES.USER,
})

/**
 * Normalizes any role (canonical or legacy alias) to its canonical backend string.
 * Returns null if the role is missing, unknown, or invalid.
 *
 * @param {string|null|undefined} role
 * @returns {string|null} canonical role ("admin" | "internal_user" | "user") or null
 */
export function normalizeRole(role) {
  if (!role || typeof role !== "string") return null
  const clean = role.toLowerCase().trim()
  return LEGACY_ROLE_MAP[clean] || null
}

/**
 * Checks whether a given role matches an expected canonical role.
 *
 * @param {string} userRole
 * @param {string} requiredRole
 * @returns {boolean}
 */
export function matchesRole(userRole, requiredRole) {
  const normUser = normalizeRole(userRole)
  const normReq = normalizeRole(requiredRole)
  if (!normUser || !normReq) return false
  return normUser === normReq
}

/**
 * Returns the default dashboard path for a given role.
 *
 * @param {string} role
 * @returns {string} "/admin/dashboard" | "/staff/dashboard" | "/portal/dashboard" | "/unauthorized"
 */
export function getDefaultDashboard(role) {
  const canonical = normalizeRole(role)
  switch (canonical) {
    case ROLES.ADMIN:
      return "/admin/dashboard"
    case ROLES.INTERNAL_USER:
      return "/staff/dashboard"
    case ROLES.USER:
      return "/portal/dashboard"
    default:
      return "/unauthorized"
  }
}

/**
 * Returns the route prefix for a given role.
 *
 * @param {string} role
 * @returns {string|null} "/admin" | "/staff" | "/portal" | null
 */
export function getRolePrefix(role) {
  const canonical = normalizeRole(role)
  switch (canonical) {
    case ROLES.ADMIN:
      return "/admin"
    case ROLES.INTERNAL_USER:
      return "/staff"
    case ROLES.USER:
      return "/portal"
    default:
      return null
  }
}

/**
 * Returns the role-specific profile path for a given role.
 *
 * @param {string} role
 * @returns {string} "/admin/profile" | "/staff/profile" | "/portal/profile" | "/profile"
 */
export function getRoleProfilePath(role) {
  const prefix = getRolePrefix(role)
  return prefix ? `${prefix}/profile` : "/profile"
}

/**
 * Verifies whether a destination path is allowed for the given role.
 * Useful for validating post-login redirect destinations.
 *
 * @param {string} pathname
 * @param {string} role
 * @returns {boolean}
 */
export function isRouteAllowedForRole(pathname, role) {
  if (!pathname || typeof pathname !== "string") return false
  const prefix = getRolePrefix(role)
  if (!prefix) return false

  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

