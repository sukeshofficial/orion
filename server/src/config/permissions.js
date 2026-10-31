import { USER_ROLES } from "./roles.js";

/**
 * Centralized Permission Catalog
 * All application permissions are defined here. Never scatter raw permission strings
 * throughout the codebase — always import from this file.
 *
 * Naming convention: <resource>.<action>
 */
export const PERMISSIONS = {
  // ── Staff management ──────────────────────────────────────────────────────
  STAFF_READ:   "staff.read",
  STAFF_CREATE: "staff.create",
  STAFF_UPDATE: "staff.update",

  // ── Customer management ───────────────────────────────────────────────────
  CUSTOMER_READ:   "customer.read",
  CUSTOMER_CREATE: "customer.create",
  CUSTOMER_UPDATE: "customer.update",

  // ── Product management ────────────────────────────────────────────────────
  PRODUCT_READ:   "product.read",
  PRODUCT_CREATE: "product.create",
  PRODUCT_UPDATE: "product.update",

  // ── Tax management ────────────────────────────────────────────────────────
  TAX_READ:   "tax.read",
  TAX_CREATE: "tax.create",
  TAX_UPDATE: "tax.update",

  // ── Plan management ───────────────────────────────────────────────────────
  PLAN_READ:   "plan.read",
  PLAN_CREATE: "plan.create",
  PLAN_UPDATE: "plan.update",

  // ── Quotation management ──────────────────────────────────────────────────
  QUOTATION_READ:   "quotation.read",
  QUOTATION_CREATE: "quotation.create",
  QUOTATION_UPDATE: "quotation.update",

  // ── Subscription management ───────────────────────────────────────────────
  SUBSCRIPTION_READ:   "subscription.read",
  SUBSCRIPTION_CREATE: "subscription.create",
  SUBSCRIPTION_UPDATE: "subscription.update",

  // ── Discount management ───────────────────────────────────────────────────
  DISCOUNT_READ:   "discount.read",
  DISCOUNT_CREATE: "discount.create",
  DISCOUNT_UPDATE: "discount.update",

  // ── Invoice management ────────────────────────────────────────────────────
  INVOICE_READ:   "invoice.read",
  INVOICE_CREATE: "invoice.create",

  // ── Payment management ────────────────────────────────────────────────────
  PAYMENT_READ:   "payment.read",
  PAYMENT_CREATE: "payment.create",

  // ── Analytics ─────────────────────────────────────────────────────────────
  ANALYTICS_READ: "analytics.read",

  // ── Profile (self-service) ────────────────────────────────────────────────
  PROFILE_READ:            "profile.read",
  PROFILE_UPDATE:          "profile.update",
  PROFILE_CHANGE_PASSWORD: "profile.change_password",

  // ── User / internal-user administration (legacy, kept for compatibility) ──
  USERS_READ:       "users.read",
  USERS_CREATE:     "users.create",
  USERS_UPDATE:     "users.update",
  USERS_DEACTIVATE: "users.deactivate",

  INTERNAL_USERS_READ:               "internal_users.read",
  INTERNAL_USERS_CREATE:             "internal_users.create",
  INTERNAL_USERS_UPDATE:             "internal_users.update",
  INTERNAL_USERS_MANAGE_PERMISSIONS: "internal_users.manage_permissions",
  INTERNAL_USERS_DEACTIVATE:         "internal_users.deactivate",

  // ── Role / permission administration ──────────────────────────────────────
  ROLES_READ:       "roles.read",
  PERMISSIONS_READ: "permissions.read",
  PERMISSIONS_ASSIGN: "permissions.assign",
};

/**
 * Flat array of every valid canonical permission string.
 * Used for validation and catalog exposure.
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Set of all valid canonical permissions for O(1) membership tests.
 */
export const PERMISSION_SET = new Set(ALL_PERMISSIONS);

// ─────────────────────────────────────────────────────────────────────────────
// Default permissions bundled per role
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permissions granted to every customer automatically.
 * Customers may only read/update their own resources — ownership enforcement
 * happens separately in the ownership middleware/service.
 */
const CUSTOMER_DEFAULT_PERMISSIONS = [
  PERMISSIONS.PROFILE_READ,
  PERMISSIONS.PROFILE_UPDATE,
  PERMISSIONS.PROFILE_CHANGE_PASSWORD,
  PERMISSIONS.QUOTATION_READ,
  PERMISSIONS.SUBSCRIPTION_READ,
  PERMISSIONS.INVOICE_READ,
  PERMISSIONS.PAYMENT_READ,
  PERMISSIONS.PAYMENT_CREATE,
  PERMISSIONS.PLAN_READ,
];

/**
 * Permissions granted to every internal_user (internal_staff) automatically.
 * Admins assign additional per-staff permissions on top of these defaults.
 */
const INTERNAL_USER_DEFAULT_PERMISSIONS = [
  PERMISSIONS.PROFILE_READ,
  PERMISSIONS.PROFILE_UPDATE,
  PERMISSIONS.PROFILE_CHANGE_PASSWORD,
  PERMISSIONS.CUSTOMER_READ,
  PERMISSIONS.PLAN_READ,
  PERMISSIONS.PRODUCT_READ,
  PERMISSIONS.TAX_READ,
  PERMISSIONS.QUOTATION_READ,
  PERMISSIONS.SUBSCRIPTION_READ,
  PERMISSIONS.DISCOUNT_READ,
  PERMISSIONS.INVOICE_READ,
  PERMISSIONS.PAYMENT_READ,
  PERMISSIONS.ANALYTICS_READ,
];

export const DEFAULT_ROLE_PERMISSIONS = {
  /** Admin has wildcard access — no explicit list needed. */
  [USER_ROLES.ADMIN]: ["*"],

  /** Internal staff base permissions. */
  [USER_ROLES.INTERNAL_USER]: INTERNAL_USER_DEFAULT_PERMISSIONS,

  /** Regular / customer user base permissions. */
  [USER_ROLES.USER]: CUSTOMER_DEFAULT_PERMISSIONS,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that every permission in the supplied array is a recognized value.
 *
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
 * Resolves the complete effective permission set for a user by merging:
 *   1. Role-default permissions
 *   2. Explicitly assigned user permissions (stored on the User document)
 *
 * Admins always receive the wildcard Set { "*" } — no individual checks needed.
 *
 * @param {object} user - Mongoose document or plain object with .role / .permissions
 * @returns {Set<string>}
 */
export const resolveUserPermissions = (user) => {
  if (!user) return new Set();

  // Normalize legacy role aliases to canonical
  const rawRole = user.role;
  let canonicalRole;
  if (rawRole === "admin") {
    canonicalRole = USER_ROLES.ADMIN;
  } else if (rawRole === "internal_staff" || rawRole === USER_ROLES.INTERNAL_USER) {
    canonicalRole = USER_ROLES.INTERNAL_USER;
  } else if (rawRole === "customer" || rawRole === "end_user" || rawRole === USER_ROLES.USER) {
    canonicalRole = USER_ROLES.USER;
  } else {
    canonicalRole = rawRole; // unknown roles get no special treatment
  }

  // Admin gets unrestricted wildcard immediately
  if (canonicalRole === USER_ROLES.ADMIN) {
    return new Set(["*"]);
  }

  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[canonicalRole] || [];
  const assigned = Array.isArray(user.permissions) ? user.permissions : [];

  return new Set([...roleDefaults, ...assigned]);
};

/**
 * Tests whether an effective permission set satisfies a single required permission.
 * Wildcard "*" satisfies any permission.
 *
 * @param {Set<string>|string[]} effectivePermissions
 * @param {string} requiredPermission
 * @returns {boolean}
 */
export const hasPermission = (effectivePermissions, requiredPermission) => {
  if (!effectivePermissions || !requiredPermission) return false;
  const permSet =
    effectivePermissions instanceof Set
      ? effectivePermissions
      : new Set(effectivePermissions);
  if (permSet.has("*")) return true;
  return permSet.has(requiredPermission);
};
