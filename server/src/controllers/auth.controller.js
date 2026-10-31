import * as authService from "../services/auth.service.js";
import { validateImageFile } from "../services/storage.service.js";

// Cookie options for secure session token delivery
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
};

/**
 * Public User Registration
 * Unconditionally assigns canonical 'user' role
 */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    const result = await authService.registerUser({
      name,
      email,
      phone,
      password,
      confirmPassword,
    });

    res.cookie("token", result.token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

/**
 * User Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    res.cookie("token", result.token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

/**
 * User Logout
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout error",
    });
  }
};

/**
 * Get Current User Profile (GET /api/v1/auth/me)
 */
export const getMe = async (req, res) => {
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

/**
 * Update Current User Profile (PATCH /api/v1/auth/me)
 */
export const updateMe = async (req, res) => {
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

/**
 * Authenticated Password Change (PATCH /api/v1/auth/me/password)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const result = await authService.changePassword(req.user._id, {
      currentPassword,
      newPassword,
      confirmPassword,
    });

    // Update session cookie with new token
    res.cookie("token", result.token, getCookieOptions());

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

/**
 * Upload Profile Picture (POST /api/v1/auth/me/profile-picture & POST /api/v1/auth/profilePic)
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    let buffer = null;
    let mimetype = "image/jpeg";

    if (req.file) {
      buffer = req.file.buffer;
      mimetype = req.file.mimetype;
    } else if (req.body?.image || req.body?.profilePic || req.body?.profilePicture) {
      // Handle base64 data URI passed in JSON body
      const dataUri = req.body.image || req.body.profilePic || req.body.profilePicture;
      const matches = String(dataUri).match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        mimetype = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      }
    }

    if (!buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file or valid image data provided",
      });
    }

    const result = await authService.updateProfilePicture(req.user._id, buffer, mimetype);

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      url: result.url,
      profilePic: result.url,
      profilePictures: result.profilePictures,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to upload profile picture",
    });
  }
};

/**
 * Select Existing Profile Picture (PATCH /api/v1/auth/me/profile-picture/select)
 */
export const selectProfilePicture = async (req, res) => {
  try {
    const { pictureUrl, url } = req.body;
    const targetUrl = pictureUrl || url;

    const result = await authService.selectProfilePicture(req.user._id, targetUrl);

    return res.status(200).json({
      success: true,
      message: result.message,
      url: result.url,
      profilePic: result.url,
      profilePictures: result.profilePictures,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to select profile picture",
    });
  }
};

/**
 * Delete Profile Picture (DELETE /api/v1/auth/me/profile-picture & DELETE /api/v1/auth/profilePic)
 * Supports query param ?url=... or body { url } to delete a specific history item, or clears active.
 */
export const deleteProfilePicture = async (req, res) => {
  try {
    const targetUrl = req.query?.url || req.body?.url || req.body?.pictureUrl;
    const result = await authService.removeProfilePicture(req.user._id, targetUrl);

    return res.status(200).json({
      success: true,
      message: result.message,
      profilePic: result.profilePic,
      profilePictures: result.profilePictures,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to remove profile picture",
    });
  }
};

/**
 * Request Email Verification Link (POST /api/v1/auth/email-verification/request)
 */
export const requestEmailVerification = async (req, res) => {
  try {
    const result = await authService.requestEmailVerification(req.user._id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to request email verification link",
    });
  }
};

/**
 * Confirm Email Verification (POST /api/v1/auth/email-verification/confirm)
 */
export const confirmEmailVerification = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await authService.confirmEmailVerification(token);

    return res.status(200).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to confirm email verification",
    });
  }
};

/**
 * Forgot Password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordRecovery(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to process password recovery request",
    });
  }
};

/**
 * Reset Password (POST /api/v1/auth/reset-password)
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, password } = req.body;
    const effectivePassword = newPassword || password;

    const result = await authService.resetPasswordWithToken(token, effectivePassword);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};

/**
 * Validate Password Reset Token (GET /api/v1/auth/verify-reset-token)
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Reset token is required",
      });
    }

    const isValid = await authService.verifyResetToken(token);
    return res.status(200).json({
      success: true,
      valid: isValid,
      message: isValid ? "Token is valid" : "Invalid or expired token",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      valid: false,
      message: error.message || "Failed to verify token",
    });
  }
};

/**
 * Legacy staff dashboard endpoint for backward compatibility
 */
export const staffDashboardOverview = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to Orion Staff Management Portal",
    data: {
      staffMember: req.user.name,
      staffEmail: req.user.email,
      role: req.user.role,
    },
  });
};

/**
 * Customer ownership test resource endpoint.
 * Ownership authorization is handled upstream by requireOwnership middleware.
 */
export const testCustomerResource = async (req, res) => {
  try {
    const { ownerId } = req.params;

    return res.status(200).json({
      success: true,
      message: "Customer resource accessed successfully",
      data: {
        resourceOwnerId: ownerId,
        content: `Private data for customer ${ownerId}`,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
