import { USER_ROLES } from "./roles.js";

/**
 * Reusable Centralized Permission Catalog
 * Project-agnostic core permissions for user management, internal users, profile, and RBAC.
 */
export const PERMISSIONS = {
  // User management
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DEACTIVATE: "users.deactivate",

  // Internal-user management
  INTERNAL_USERS_READ: "internal_users.read",
  INTERNAL_USERS_CREATE: "internal_users.create",
  INTERNAL_USERS_UPDATE: "internal_users.update",
  INTERNAL_USERS_MANAGE_PERMISSIONS: "internal_users.manage_permissions",
  INTERNAL_USERS_DEACTIVATE: "internal_users.deactivate",

  // Profile management
  PROFILE_READ: "profile.read",
  PROFILE_UPDATE: "profile.update",
  PROFILE_CHANGE_PASSWORD: "profile.change_password",

  // Role and permission management
  ROLES_READ: "roles.read",
  PERMISSIONS_READ: "permissions.read",
  PERMISSIONS_ASSIGN: "permissions.assign",
};

/**
 * Array of all valid canonical permissions
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Set of all valid canonical permissions for fast O(1) lookup
 */
export const PERMISSION_SET = new Set(ALL_PERMISSIONS);

/**
 * Default permissions bundled with roles
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ["*"], // Wildcard: Admin receives unrestricted access
  [USER_ROLES.INTERNAL_USER]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.PROFILE_CHANGE_PASSWORD,
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.PROFILE_CHANGE_PASSWORD,
  ],
};

/**
 * Validates whether an array of permissions are all recognized by the allowlist.
 * @param {string[]} permissions
 * @returns {{ valid: boolean, invalid: string[] }}
 */
export const validatePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) {
    return { valid: false, invalid: ["Invalid permissions format: expected array"] };
  }
  const invalid = permissions.filter((p) => !PERMISSION_SET.has(p));
  return {
    valid: invalid.length === 0,
    invalid,
  };
};

/**
 * Resolves the effective permission set for a user based on:
 * 1. Role defaults
 * 2. Explicit user permissions (stored on the user document)
 * 3. Safe admin wildcard resolution
 *
 * @param {object} user - Mongoose user document or POJO
 * @returns {Set<string>} - Set of authorized permission strings or Set with "*" for admin
 */
export const resolveUserPermissions = (user) => {
  if (!user) return new Set();

  const role = user.role;
  const canonicalRole = role === "admin" ? USER_ROLES.ADMIN : (role === "internal_staff" ? USER_ROLES.INTERNAL_USER : (role === "customer" || role === "end_user" ? USER_ROLES.USER : role));

  if (canonicalRole === USER_ROLES.ADMIN) {
    return new Set(["*"]);
  }

  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[canonicalRole] || [];
  const assigned = Array.isArray(user.permissions) ? user.permissions : [];

  const effective = new Set([...roleDefaults, ...assigned]);

  // Backward-compatibility: map legacy permission strings if needed
  if (role === "internal_staff") {
    effective.add("view:all_orders");
    effective.add("manage:internal_dashboard");
    effective.add("manage:staff_ops");
    effective.add("view:own_profile");
    effective.add("edit:own_profile");
  } else if (role === "customer") {
    effective.add("view:own_orders");
    effective.add("edit:own_profile");
  }

  return effective;
};

/**
 * Checks whether an effective permission set satisfies a required permission.
 * Supports safe wildcard ('*') for admin.
 *
 * @param {Set<string>|string[]} effectivePermissions
 * @param {string} requiredPermission
 * @returns {boolean}
 */
export const hasPermission = (effectivePermissions, requiredPermission) => {
  if (!effectivePermissions || !requiredPermission) return false;
  const permSet = effectivePermissions instanceof Set ? effectivePermissions : new Set(effectivePermissions);
  if (permSet.has("*")) return true;
  return permSet.has(requiredPermission);
};
