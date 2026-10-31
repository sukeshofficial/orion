import User, { USER_STATUS } from "../models/user.model.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";
import { validatePermissions } from "../config/permissions.js";

/**
 * User Service
 * Provides generic administrative user management, query filtering, and internal-user provisioning.
 */

/**
 * List application users with pagination and filtering.
 */
export const listUsers = async ({ page = 1, limit = 20, role, status, search }) => {
  const query = {};

  if (role) {
    query.role = normalizeRole(role);
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(take),
    User.countDocuments(query),
  ]);

  return {
    users: users.map((u) => u.toSafeObject()),
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Retrieve user by ID.
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
};

/**
 * Provision an internal user through administrative API.
 */
export const createInternalUser = async ({ name, email, phone, password, permissions = [] }) => {
  if (!name || !email || !phone || !password) {
    const error = new Error("Name, email, phone, and password are required");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }

  const { valid, invalid } = validatePermissions(permissions);
  if (!valid) {
    const error = new Error(`Invalid permissions specified: ${invalid.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const internalUser = new User({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,
    role: USER_ROLES.INTERNAL_USER,
    status: USER_STATUS.ACTIVE,
    permissions,
    tokenVersion: 0,
  });

  await internalUser.save();
  return internalUser.toSafeObject();
};

/**
 * Update an internal user's assigned permissions.
 */
export const updateInternalUserPermissions = async (userId, permissions = []) => {
  const { valid, invalid } = validatePermissions(permissions);
  if (!valid) {
    const error = new Error(`Invalid permissions specified: ${invalid.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Ensure target is an internal_user
  const canonicalRole = normalizeRole(user.role);
  if (canonicalRole !== USER_ROLES.INTERNAL_USER) {
    const error = new Error("Permissions can only be assigned to internal users");
    error.statusCode = 400;
    throw error;
  }

  user.permissions = permissions;
  await user.save();

  return user.toSafeObject();
};

/**
 * Update user status (e.g. active / disabled).
 * Prevents accidental deactivation of the last active administrator.
 */
export const updateUserStatus = async (userId, status) => {
  if (!Object.values(USER_STATUS).includes(status)) {
    const error = new Error(`Invalid status: ${status}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Prevent disabling the last active administrator
  if (status === USER_STATUS.DISABLED && normalizeRole(user.role) === USER_ROLES.ADMIN) {
    const activeAdminCount = await User.countDocuments({
      role: { $in: [USER_ROLES.ADMIN, "admin"] },
      status: USER_STATUS.ACTIVE,
    });

    if (activeAdminCount <= 1) {
      const error = new Error("Cannot deactivate the last active administrator account");
      error.statusCode = 400;
      throw error;
    }
  }

  user.status = status;
  // If disabling, increment tokenVersion to immediately revoke sessions
  if (status === USER_STATUS.DISABLED) {
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  }

  await user.save();
  return user.toSafeObject();
};
