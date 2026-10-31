import User, { USER_STATUS } from "../models/user.model.js";
import { verifyToken } from "../utils/token.utils.js";
import { normalizeRole, matchesRole, USER_ROLES } from "../config/roles.js";
import { resolveUserPermissions, hasPermission } from "../config/permissions.js";

// ─────────────────────────────────────────────────────────────────────────────
// authenticate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authentication Middleware
 *
 * Extracts a JWT from an HTTP-only cookie (`token`) or the `Authorization: Bearer`
 * header, verifies its signature and expiration, and validates the embedded
 * tokenVersion against the database record to detect invalidated sessions.
 *
 * On success:
 *   - req.user                  → fresh Mongoose User document (never the JWT payload)
 *   - req.userEffectivePermissions → Set<string> of resolved permissions
 *
 * Never trust role/permission values from the request body.
 * All authorization decisions are made from req.user populated here.
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from cookie or Authorization header
    let token = null;
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // 2. Verify JWT signature / expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication credentials.",
      });
    }

    // 3. Load fresh user from the database — never trust the JWT payload for authorization
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // 4. Validate tokenVersion to detect invalidated sessions
    const tokenVersion   = typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : 0;
    const dbTokenVersion = typeof user.tokenVersion    === "number" ? user.tokenVersion    : 0;
    if (tokenVersion < dbTokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session has been invalidated. Please log in again with your new password.",
      });
    }

    // 5. Reject disabled accounts
    if (user.status === USER_STATUS.DISABLED) {
      return res.status(403).json({
        success: false,
        message: "Your account is disabled. Access denied.",
      });
    }

    // 6. Attach trusted identity to request
    req.user = user;
    req.userEffectivePermissions = resolveUserPermissions(user);
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication processing error",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// requireRole  /  authorizeRole  (aliases)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Role Authorization Middleware Factory
 *
 * Restricts access to one or more roles.  Both canonical names and legacy
 * aliases are supported (e.g. "internal_staff" ≡ "internal_user").
 *
 * Usage:
 *   router.get("/admin-area", authenticate, requireRole("admin"), handler);
 *   router.get("/staff-area", authenticate, requireRole("admin", "internal_user"), handler);
 *
 * Returns 401 when no authenticated user is attached.
 * Returns 403 when the user's role does not match any allowed role.
 *
 * @param {...string} allowedRoles - canonical or legacy role names
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification.",
      });
    }

    const hasRole = allowedRoles.some((allowed) =>
      matchesRole(req.user.role, allowed)
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not possess the required role permissions.",
      });
    }

    next();
  };
};

/** Alias matching the spec's authorizeRole name. */
export const authorizeRole = requireRole;

// ─────────────────────────────────────────────────────────────────────────────
// requirePermission  /  authorizePermission  (aliases)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permission Authorization Middleware Factory
 *
 * Requires that the authenticated user holds ALL of the listed permissions.
 * Admins possess the wildcard ("*") and are always granted access.
 *
 * Usage:
 *   router.get("/customers", authenticate, requirePermission(PERMISSIONS.CUSTOMER_READ), handler);
 *
 * Returns 401 when no authenticated user is attached.
 * Returns 403 when any required permission is missing.
 *
 * @param {...string} requiredPermissions
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before permission verification.",
      });
    }

    const effective =
      req.userEffectivePermissions || resolveUserPermissions(req.user);

    // Wildcard: admin has access to everything
    if (effective.has("*")) {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) =>
      hasPermission(effective, perm)
    );

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Lacking required permissions: ${requiredPermissions.join(", ")}`,
      });
    }

    next();
  };
};

/** Alias matching the spec's authorizePermission name. */
export const authorizePermission = requirePermission;

// ─────────────────────────────────────────────────────────────────────────────
// requireVerifiedEmail
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Email Verification Guard
 *
 * Ensures the authenticated user has confirmed their email address.
 * Must be placed after `authenticate` in the middleware chain.
 *
 * Returns 401 when no user is attached.
 * Returns 403 with code EMAIL_NOT_VERIFIED when the email is unverified.
 */
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required before email verification check.",
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Please verify your email address to access this resource.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// requireOwnership  (reusable ownership guard middleware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ownership Authorization Middleware Factory
 *
 * Prevents IDOR (Insecure Direct Object Reference) by verifying that the
 * requesting user owns the resource they are trying to access.
 *
 * Rules:
 *   - Admin: always allowed (configurable via allowAdmin)
 *   - Internal staff: allowed by default (configurable via allowStaff)
 *   - Staff with requiredPermission: allowed when they possess the permission
 *   - Customer: allowed only when their ID matches the resource owner ID
 *
 * Usage:
 *   router.get(
 *     "/invoices/:customerId",
 *     authenticate,
 *     requireOwnership({ ownerIdParam: "customerId" }),
 *     handler
 *   );
 *
 * @param {object} options
 * @param {string}  [options.ownerIdParam="ownerId"]  - req.params key holding the owner ID
 * @param {boolean} [options.allowAdmin=true]         - whether admin bypasses ownership
 * @param {boolean} [options.allowStaff=true]         - whether internal staff bypasses ownership
 * @param {string}  [options.requiredPermission=null] - staff-level permission granting bypass
 */
export const requireOwnership = ({
  ownerIdParam       = "ownerId",
  allowAdmin         = true,
  allowStaff         = true,
  requiredPermission = null,
} = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for resource access.",
      });
    }

    const canonicalRole = normalizeRole(req.user.role);

    // 1. Admin bypass
    if (allowAdmin && canonicalRole === USER_ROLES.ADMIN) {
      return next();
    }

    // 2. Internal staff bypass
    if (
      allowStaff &&
      (canonicalRole === USER_ROLES.INTERNAL_USER ||
        req.user.role === "internal_staff")
    ) {
      // Staff must have the required permission (if specified)
      if (requiredPermission) {
        const effective =
          req.userEffectivePermissions || resolveUserPermissions(req.user);
        if (!hasPermission(effective, requiredPermission)) {
          return res.status(403).json({
            success: false,
            message: `Forbidden: Lacking required permission: ${requiredPermission}`,
          });
        }
      }
      return next();
    }

    // 3. Permission-based bypass (for staff with specific permission when allowStaff=false)
    if (requiredPermission) {
      const effective =
        req.userEffectivePermissions || resolveUserPermissions(req.user);
      if (hasPermission(effective, requiredPermission)) {
        return next();
      }
    }

    // 4. Strict owner match — the resource owner ID must equal the authenticated user ID
    const resourceOwnerId = req.params[ownerIdParam];
    const authenticatedUserId = (req.user._id || req.user.id)?.toString?.();

    const normalizedOwnerId = resourceOwnerId
      ? String(resourceOwnerId).trim()
      : "";

    if (
      !normalizedOwnerId ||
      !authenticatedUserId ||
      normalizedOwnerId !== authenticatedUserId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have permission to access this resource.",
      });
    }

    next();
  };
};
