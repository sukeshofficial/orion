import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import User, { USER_STATUS } from "../src/models/user.model.js";
import { USER_ROLES } from "../src/config/roles.js";

/**
 * Remove control characters from values before writing them to logs.
 * Prevents newline-based log injection.
 */
const sanitizeLogValue = (value) =>
  String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "");

/**
 * Admin Bootstrap Script
 * Creates the initial administrator safely through controlled provisioning.
 *
 * Requirements:
 * - Read initial admin credentials from environment variables (or CLI args).
 * - Validate all required environment variables / inputs.
 * - Hash password using existing authentication password utility (User model bcrypt pre-save hook).
 * - Create account with admin role and wildcard permissions.
 * - Prevent duplicate administrator creation and exit safely if administrator already exists.
 * - Never hardcode production credentials.
 * - Do not expose passwords or password hashes in logs.
 * - Cleanly disconnect database connection upon completion.
 *
 * Usage:
 *   node scripts/create-admin.js [email] [password] [name] [phone]
 * Or via environment variables:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=StrongPassword123! ADMIN_NAME="Root Admin" npm run seed:admin
 */
const bootstrapAdmin = async () => {
  const args = process.argv.slice(2);

  const email = (args[0] || process.env.ADMIN_EMAIL || "").trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || "";
  const name = (args[2] || process.env.ADMIN_NAME || "Administrator").trim();
  const phone = (args[3] || process.env.ADMIN_PHONE || "+1 555-0100").trim();

  // Validate required parameters
  if (!email || !password) {
    console.error("Error: Admin email and password are required.");
    console.error("Please configure ADMIN_EMAIL and ADMIN_PASSWORD in environment variables, or pass via CLI:");
    console.error("Usage: node scripts/create-admin.js <email> <password> [name] [phone]");
    process.exitCode = 1;
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    console.error("Error: A valid email format is required for ADMIN_EMAIL.");
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("Error: Admin password must be at least 8 characters long.");
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role === USER_ROLES.ADMIN) {
        console.log(
          `Notice: An admin account already exists with email: ${sanitizeLogValue(normalizedEmail)}.`
        );
        console.log("Safe non-destructive exit: Existing admin credentials and permissions were NOT altered.");
        process.exitCode = 0;
        return;
      }

      console.error(
        `Error: An account with email '${sanitizeLogValue(normalizedEmail)}' already exists with role '${sanitizeLogValue(existingUser.role)}'.`
      );
      console.error("Accidental privilege elevation prevented. Existing accounts are not modified by this script.");
      process.exitCode = 1;
      return;
    }

    const admin = new User({
      name,
      email: normalizedEmail,
      phone,
      password, // Password hashed by User model bcrypt pre-save hook
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      permissions: ["*"],
      tokenVersion: 0,
      emailVerified: true,
    });

    await admin.save();

    console.log("Admin account successfully bootstrapped:");
    console.log(`Name:  ${sanitizeLogValue(admin.name)}`);
    console.log(`Email: ${sanitizeLogValue(admin.email)}`);
    console.log(`Role:  ${sanitizeLogValue(admin.role)}`);
    console.log("Password: [REDACTED]");
    console.log("Token:    [REDACTED]");

    process.exitCode = 0;
  } catch (error) {
    console.error(
      "Failed to bootstrap admin:",
      sanitizeLogValue(error?.message || "An unexpected error occurred")
    );
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

bootstrapAdmin();
