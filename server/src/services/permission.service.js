import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  validatePermissions,
  resolveUserPermissions,
  hasPermission,
} from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

/**
 * Permission Service
 * Exposes inspection and validation helpers for authorization and administrative management.
 */

export const getPermissionCatalog = () => {
  return {
    permissions: ALL_PERMISSIONS,
    roles: Object.values(USER_ROLES),
    defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
  };
};

export const validatePermissionList = (permissions) => {
  return validatePermissions(permissions);
};

export const getUserEffectivePermissions = (user) => {
  const permSet = resolveUserPermissions(user);
  return Array.from(permSet);
};

export { hasPermission };
