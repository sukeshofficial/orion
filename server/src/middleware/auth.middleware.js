import User, { USER_STATUS } from "../models/user.model.js";
import { verifyToken } from "../utils/token.utils.js";
import { normalizeRole, matchesRole, USER_ROLES } from "../config/roles.js";
import { resolveUserPermissions, hasPermission } from "../config/permissions.js";

/**
 * Authentication Middleware:
 * Extracts JWT from HTTP-only cookie or Authorization header,
 * verifies signature, expiration, and tokenVersion against database.
 * Attaches trusted, latest user from MongoDB to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
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

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // Check tokenVersion for session invalidation (after password change/reset)
    // Only invalidate if token has a defined tokenVersion and it's older than database version
    const tokenVersion = typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : 0;
    const dbTokenVersion = typeof user.tokenVersion === "number" ? user.tokenVersion : 0;
    if (tokenVersion < dbTokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session has been invalidated. Please log in again with your new password.",
      });
    }

    if (user.status === USER_STATUS.DISABLED) {
      return res.status(403).json({
        success: false,
        message: "Your account is disabled. Access denied.",
      });
    }

    // Attach trusted identity and permissions to request object
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

/**
 * Role Authorization Middleware:
 * Restricts access to one or more specified roles.
 * Canonical roles (admin, internal_user, user) and legacy aliases (internal_staff, customer) are supported.
 * Rejects with 403 Forbidden if user lacks permitted role.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification.",
      });
    }

    // Admin has access to administrative routes or general routes where admin is allowed
    const userRole = req.user.role;
    const hasRole = allowedRoles.some((allowedRole) => matchesRole(userRole, allowedRole));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not possess the required role permissions.",
      });
    }

    next();
  };
};

/**
 * Permission Authorization Middleware:
 * Requires one or multiple permissions.
 * Admins possess wildcard ('*') access.
 * Denies by default for unassigned permissions or unknown roles.
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before permission verification.",
      });
    }

    const effectivePermissions =
      req.userEffectivePermissions || resolveUserPermissions(req.user);

    // If user is admin (wildcard), allow immediately
    if (effectivePermissions.has("*")) {
      return next();
    }

    // Check if user has all required permissions
    const hasAll = requiredPermissions.every((perm) =>
      hasPermission(effectivePermissions, perm)
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

/**
 * Verified Email Authorization Middleware:
 * Reusable middleware ensuring the authenticated user has verified their email address.
 * Rejects with 403 Forbidden if emailVerified is false.
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
