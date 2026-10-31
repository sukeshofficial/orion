import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/config/db.js";
import User, { USER_STATUS } from "../src/models/user.model.js";
import { USER_ROLES } from "../src/config/roles.js";
import { validatePermissions } from "../src/config/permissions.js";

/**
 * Remove control characters from values before writing them to logs.
 * Prevents newline-based log injection.
 */
const sanitizeLogValue = (value) =>
  String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "");

/**
 * Provision Internal User Script
 *
 * Usage:
 *   node scripts/create-internal-user.js <email> <password> [name] [phone] [comma-separated-permissions]
 *
 * Examples:
 *   node scripts/create-internal-user.js staff@example.com StaffPass123! "Alex Operations" "+1 555-0199" "users.read,profile.read"
 */
const provisionInternalUser = async () => {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Error: Email and password are required.");
    console.error(
      "Usage: node scripts/create-internal-user.js <email> <password> [name] [phone] [permissions]"
    );
    process.exitCode = 1;
    return;
  }

  const [
    email,
    password,
    name = "Internal User",
    phone = "+1 555-0150",
    permsArg = "",
  ] = args;

  if (password.length < 8) {
    console.error("Error: Password must be at least 8 characters long.");
    process.exitCode = 1;
    return;
  }

  const permissions = permsArg
    ? permsArg.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  const { valid, invalid } = validatePermissions(permissions);
  if (!valid) {
    console.error(
      `Error: Invalid permissions provided: ${invalid.join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.error(
        `Error: An account with email '${sanitizeLogValue(normalizedEmail)}' already exists with role '${sanitizeLogValue(existingUser.role)}'.`
      );
      console.error("Accidental overwrite prevented. Existing accounts and passwords are not modified.");
      process.exitCode = 1;
      return;
    }

    const internalUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password, // Pre-save hook securely hashes this
      role: USER_ROLES.INTERNAL_USER,
      status: USER_STATUS.ACTIVE,
      permissions,
      tokenVersion: 0,
    });

    await internalUser.save();

    console.log("Internal user created successfully:");
    console.log(`Name:        ${sanitizeLogValue(internalUser.name)}`);
    console.log(`Email:       ${sanitizeLogValue(internalUser.email)}`);
    console.log(`Role:        ${sanitizeLogValue(internalUser.role)}`);
    console.log(`Permissions: ${internalUser.permissions.join(", ") || "(none)"}`);
    console.log("Password:    [REDACTED]");

    process.exitCode = 0;
  } catch (error) {
    console.error(
      "Failed to provision internal user:",
      sanitizeLogValue(error?.message || "An unexpected error occurred")
    );
    process.exitCode = 1;
  }
};

provisionInternalUser();
