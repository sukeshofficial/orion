import * as authService from "../services/auth.service.js";

/**
 * User Profile Controller
 * Dedicated controller for current user profile operations
 */

export const getProfile = async (req, res) => {
  try {
    const profile = await authService.getUserProfile(req.user._id);
    return res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { user: updatedUser, ignoredFields } =
      await authService.updateUserProfile(req.user._id, req.body);

    const responsePayload = {
      success: true,
      message:
        ignoredFields.length > 0
          ? `Profile updated. Prohibited fields were ignored: ${ignoredFields.join(", ")}`
          : "Profile updated successfully",
      user: updatedUser,
    };

    if (ignoredFields.length > 0) {
      responsePayload.ignoredFields = ignoredFields;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const result = await authService.changePassword(req.user._id, {
      currentPassword,
      newPassword,
      confirmPassword,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
};
