import * as userService from "../services/user.service.js";
import * as permissionService from "../services/permission.service.js";

/**
 * Admin Controller
 * Manages users, internal users, roles, and permissions
 */

export const listUsers = async (req, res) => {
  try {
    const { page, limit, role, status, search } = req.query;
    const result = await userService.listUsers({ page, limit, role, status, search });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list users",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve user",
    });
  }
};

export const createInternalUser = async (req, res) => {
  try {
    const { name, email, phone, password, permissions } = req.body;
    const user = await userService.createInternalUser({
      name,
      email,
      phone,
      password,
      permissions,
    });

    return res.status(201).json({
      success: true,
      message: "Internal user created successfully",
      user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create internal user",
    });
  }
};

export const updateInternalUserPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await userService.updateInternalUserPermissions(req.params.id, permissions);

    return res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update permissions",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await userService.updateUserStatus(req.params.id, status);

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update status",
    });
  }
};

export const getCatalog = async (req, res) => {
  try {
    const catalog = permissionService.getPermissionCatalog();
    return res.status(200).json({
      success: true,
      ...catalog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch permission catalog",
    });
  }
};
