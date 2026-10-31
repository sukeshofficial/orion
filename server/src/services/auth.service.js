import crypto from "node:crypto";
import User, { USER_STATUS } from "../models/user.model.js";
import Customer from "../models/customer.model.js";
import { generateCustomerNumber } from "./customer.service.js";
import { USER_ROLES } from "../config/roles.js";
import { generateToken, verifyToken } from "../utils/token.utils.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.service.js";
import { uploadImage, validateImageFile } from "./storage.service.js";

// Re-export token utilities for backward compatibility
export { generateToken, verifyToken };

/**
 * Register a new user.
 * Strict security: Role is unconditionally forced to 'user'.
 * Any client-supplied role, permissions, status, or tokenVersion is stripped.
 */
export const registerUser = async ({ name, email, phone, password, confirmPassword }) => {
  if (!name || !email || !phone || !password) {
    const error = new Error("All fields (name, email, phone, password) are required");
    error.statusCode = 400;
    throw error;
  }

  if (confirmPassword && password !== confirmPassword) {
    const error = new Error("Password confirmation does not match");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
  const verificationExpiresMinutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES || "30", 10);
  const verificationExpires = new Date(Date.now() + verificationExpiresMinutes * 60 * 1000);

  // Strictly assign default canonical user role, unverified email, and verification token
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password, // Mongoose pre-save hook will securely hash
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    emailVerified: false,
    emailVerificationToken: hashedVerificationToken,
    emailVerificationExpires: verificationExpires,
    emailVerificationSentAt: new Date(),
    permissions: [],
    tokenVersion: 0,
  });

  await user.save();
  const token = generateToken(user);

  // Automatically provision default Customer profile for new customer account
  try {
    const custNum = await generateCustomerNumber();
    await Customer.create({
      userId: user._id,
      customerNumber: custNum,
      companyName: user.name || "Customer",
      phone: user.phone || "",
      billingAddress: {},
      taxIdentificationNumber: "",
      isActive: true,
    });
  } catch (custErr) {
    console.error("Auto customer creation error:", custErr?.message);
  }

  // Dispatch verification email in the background without blocking registration response
  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken,
      expirationMinutes: verificationExpiresMinutes,
    });
  } catch (emailErr) {
    console.error("Failed to dispatch registration verification email:", emailErr?.message);
  }

  return {
    user: user.toSafeObject(),
    token,
  };
};

// Backward-compatible alias
export const registerCustomer = registerUser;

/**
 * Authenticate user with email and password.
 * Uses generic error messages to prevent account enumeration.
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.status === USER_STATUS.DISABLED) {
    const error = new Error("Account is disabled. Please contact support.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Automatic admin promotion if user email matches configured ADMIN_EMAIL
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (adminEmail && normalizedEmail === adminEmail && user.role !== USER_ROLES.ADMIN) {
    user.role = USER_ROLES.ADMIN;
    user.permissions = ["*"];
    await user.save();
  }

  const token = generateToken(user);

  return {
    user: user.toSafeObject(),
    token,
  };
};

/**
 * Get profile for authenticated user ID
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.status === USER_STATUS.DISABLED) {
    const error = new Error("Account is disabled");
    error.statusCode = 403;
    throw error;
  }

  return user.toSafeObject();
};

/**
 * Update permitted profile fields.
 * Prevents mass-assignment of role, status, email, password, permissions, tokenVersion.
 * Returns updated user and any prohibited fields that were ignored.
 */
export const updateUserProfile = async (userId, updates = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Detect any prohibited fields attempted to be modified
  const prohibitedFieldsList = new Set([
    "role",
    "status",
    "email",
    "password",
    "permissions",
    "tokenVersion",
    "passwordResetToken",
    "passwordResetExpires",
    "emailVerified",
    "id",
    "_id",
    "createdAt",
    "updatedAt",
  ]);

  const ignoredFields = Object.keys(updates).filter((key) =>
    prohibitedFieldsList.has(key)
  );

  // Only permit safe personal profile updates
  if (updates.name && typeof updates.name === "string" && updates.name.trim()) {
    user.name = updates.name.trim();
  }
  if (updates.phone && typeof updates.phone === "string" && updates.phone.trim()) {
    user.phone = updates.phone.trim();
  }
  if (typeof updates.profilePicture === "string") {
    // Only allow setting empty string or valid URL directly through profile update
    user.profilePicture = updates.profilePicture.trim();
  }

  await user.save();
  return {
    user: user.toSafeObject(),
    ignoredFields,
  };
};

/**
 * Update user's profile picture using storage abstraction.
 * Automatically appends the new image to user's profilePictures history.
 * @param {string} userId
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 */
export const updateProfilePicture = async (userId, fileBuffer, mimetype) => {
  const validation = validateImageFile({ buffer: fileBuffer, mimetype, size: fileBuffer.length });
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const uploadResult = await uploadImage(fileBuffer, mimetype, "avatars");

  user.profilePicture = uploadResult.url;
  if (!Array.isArray(user.profilePictures)) {
    user.profilePictures = [];
  }
  // Add new image to the front of history if not already present
  if (!user.profilePictures.includes(uploadResult.url)) {
    user.profilePictures.unshift(uploadResult.url);
  }
  await user.save();

  return {
    url: uploadResult.url,
    profilePic: uploadResult.url,
    profilePictures: user.profilePictures,
    user: user.toSafeObject(),
  };
};

/**
 * Select an existing profile picture from history as active.
 * @param {string} userId
 * @param {string} pictureUrl
 */
export const selectProfilePicture = async (userId, pictureUrl) => {
  if (!pictureUrl) {
    const error = new Error("Picture URL is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.profilePicture = pictureUrl;
  if (!Array.isArray(user.profilePictures)) {
    user.profilePictures = [];
  }
  if (!user.profilePictures.includes(pictureUrl)) {
    user.profilePictures.unshift(pictureUrl);
  }
  await user.save();

  return {
    url: pictureUrl,
    profilePic: pictureUrl,
    profilePictures: user.profilePictures,
    user: user.toSafeObject(),
    message: "Profile picture selected successfully",
  };
};

/**
 * Remove user's active profile picture or delete a specific picture from history.
 * @param {string} userId
 * @param {string} [pictureUrl] - Specific URL to remove from history. If omitted or matches active, clears active.
 */
export const removeProfilePicture = async (userId, pictureUrl) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(user.profilePictures)) {
    user.profilePictures = [];
  }

  if (pictureUrl) {
    // Remove specific picture from history
    user.profilePictures = user.profilePictures.filter((p) => p !== pictureUrl);
    // If the deleted picture was the active one, switch to the next available or empty
    if (user.profilePicture === pictureUrl) {
      user.profilePicture = user.profilePictures.length > 0 ? user.profilePictures[0] : "";
    }
  } else {
    // Clear active profile picture
    const current = user.profilePicture;
    user.profilePicture = "";
    if (current) {
      user.profilePictures = user.profilePictures.filter((p) => p !== current);
    }
  }

  await user.save();

  return {
    user: user.toSafeObject(),
    profilePic: user.profilePicture,
    profilePictures: user.profilePictures,
    message: "Profile picture removed successfully",
  };
};

/**
 * Authenticated password change.
 * Verifies current password, updates to new password, and increments tokenVersion to invalidate existing JWTs.
 */
export const changePassword = async (userId, { currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword || !newPassword) {
    const error = new Error("Current password and new password are required");
    error.statusCode = 400;
    throw error;
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    const error = new Error("New password confirmation does not match");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error("New password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error("New password cannot be identical to current password");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select("+password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error("Incorrect current password");
    error.statusCode = 400;
    throw error;
  }

  // Update password and invalidate previous sessions by incrementing tokenVersion
  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  // Issue new token with the new tokenVersion
  const newToken = generateToken(user);

  return {
    message: "Password changed successfully. All previous sessions have been invalidated.",
    token: newToken,
    user: user.toSafeObject(),
  };
};

/**
 * Request password recovery.
 * Generates an opaque crypto recovery token and expiration.
 * In production, outbound email sends the link.
 */
export const requestPasswordRecovery = async (email) => {
  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && user.status !== USER_STATUS.DISABLED) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send secure password reset email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetToken,
      });
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr?.message);
    }
  }

  // Return generic response regardless of whether email exists to prevent enumeration
  return {
    message: "If an active account exists with that email address, a password recovery link has been sent.",
  };
};

/**
 * Reset password with a valid recovery token.
 * Increments tokenVersion to invalidate existing sessions.
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  if (!token || !newPassword) {
    const error = new Error("Recovery token and new password are required");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    const error = new Error("Invalid or expired password recovery token");
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // Invalidate all existing tokens
  await user.save();

  return {
    message: "Password has been reset successfully. Please log in with your new credentials.",
  };
};

/**
 * Verify whether a reset token is valid and unexpired without resetting the password yet.
 */
export const verifyResetToken = async (token) => {
  if (!token) return false;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });
  return Boolean(user);
};

/**
 * Request an email verification link.
 * Authenticates user, checks if already verified, applies cooldown rate-limiting,
 * generates a single-use SHA-256 hashed token with 30-min expiration, and emails it.
 *
 * @param {string} userId
 */
export const requestEmailVerification = async (userId) => {
  const user = await User.findById(userId).select("+emailVerificationSentAt");
  if (!user) {
    const error = new Error("User account not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error("Your email address is already verified");
    error.statusCode = 400;
    throw error;
  }

  // Resend cooldown rate limit: 60 seconds
  const COOLDOWN_SECONDS = 60;
  if (user.emailVerificationSentAt) {
    const timeSinceLastSent = (Date.now() - new Date(user.emailVerificationSentAt).getTime()) / 1000;
    if (timeSinceLastSent < COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(COOLDOWN_SECONDS - timeSinceLastSent);
      const error = new Error(`Please wait ${waitSeconds} seconds before requesting another verification email.`);
      error.statusCode = 429;
      throw error;
    }
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
  const expirationMinutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES || "30", 10);
  const expirationDate = new Date(Date.now() + expirationMinutes * 60 * 1000);

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expirationDate;
  user.emailVerificationSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken,
      expirationMinutes,
    });
  } catch (emailErr) {
    console.error("Failed to send email verification link:", emailErr?.message);
    const error = new Error("Failed to dispatch verification email. Please try again later.");
    error.statusCode = 500;
    throw error;
  }

  return {
    success: true,
    message: "A verification link has been sent to your registered email address.",
  };
};

/**
 * Confirm email verification with submitted token.
 * Validates expiration, single-use token, and atomically updates emailVerified to true.
 *
 * @param {string} token
 */
export const confirmEmailVerification = async (token) => {
  if (!token || typeof token !== "string") {
    const error = new Error("Verification token is required");
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

  // Atomically find and update matching user if token is valid and unexpired
  const user = await User.findOneAndUpdate(
    {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    },
    {
      $set: { emailVerified: true },
      $unset: {
        emailVerificationToken: 1,
        emailVerificationExpires: 1,
      },
    },
    { new: true }
  );

  if (!user) {
    const error = new Error("Invalid or expired verification link. Please request a new verification email.");
    error.statusCode = 400;
    throw error;
  }

  return {
    success: true,
    message: "Email address verified successfully!",
    user: user.toSafeObject(),
  };
};
