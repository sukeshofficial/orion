
import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/config/db.js";
import User, { USER_ROLES, USER_STATUS } from "../src/models/user.model.js";
import { generateToken } from "../src/services/auth.service.js";

/**
 * Remove control characters from values before writing them to logs.
 * This prevents newline-based log injection.
 */
const sanitizeLogValue = (value) =>
  String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "");

/**
 * Helper to upsert a single staff member.
 */
const upsertStaff = async ({ name, email, phone, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  let staff = await User.findOne({ email: normalizedEmail });

  if (staff) {
    staff.name = name;
    staff.phone = phone;
    staff.role = USER_ROLES.INTERNAL_STAFF;
    staff.status = USER_STATUS.ACTIVE;
    staff.password = password;

    // The model's pre-save hook is expected to hash modified passwords.
    await staff.save();

    console.log(
      `Updated existing internal_staff account: ${sanitizeLogValue(normalizedEmail)}`
    );
  } else {
    staff = new User({
      name,
      email: normalizedEmail,
      phone,
      password,
      role: USER_ROLES.INTERNAL_STAFF,
      status: USER_STATUS.ACTIVE,
    });

    await staff.save();

    console.log(
      `Created new internal_staff account: ${sanitizeLogValue(normalizedEmail)}`
    );
  }

  // Preserve token generation for compatibility with the existing workflow.
  // Never print the token or password to the console.
  const token = generateToken(staff);

  return { staff, token };
};

// Usage:
// node create-staff.js <email> <password> [name] [phone]

const args = process.argv.slice(2);

let staffList = [];

if (args.length >= 2) {
  const [
    email,
    password,
    name = "Staff Member",
    phone = "+1 555-0100",
  ] = args;

  staffList = [{ email, password, name, phone }];
} else {
  staffList = [
    {
      name: "Operations Staff",
      email: "operations.staff@orion.internal",
      phone: "+1 555-8801",
      password: "StaffSecurePassword123!",
    },
    {
      name: "Inventory Manager",
      email: "inventory.staff@orion.internal",
      phone: "+1 555-8802",
      password: "StaffSecurePassword123!",
    },
    {
      name: "Support Staff",
      email: "support.staff@orion.internal",
      phone: "+1 555-8803",
      password: "StaffSecurePassword123!",
    },
  ];
}

try {
  await connectDB();

  console.log(
    `Provisioning ${staffList.length} staff account(s)...`
  );

  // Promise.all preserves the original result ordering.
  const results = await Promise.all(
    staffList.map((member) => upsertStaff(member))
  );

  console.log("\nStaff provisioning completed:");

  results.forEach(({ staff }, index) => {
    console.log(`\nStaff member #${index + 1}`);
    console.log(`Name:  ${sanitizeLogValue(staff.name)}`);
    console.log(`Email: ${sanitizeLogValue(staff.email)}`);
    console.log(`Role:  ${sanitizeLogValue(staff.role)}`);
    console.log("Password: [REDACTED]");
    console.log("Authentication token: [REDACTED]");
  });

  console.log("\nAll staff accounts processed successfully.");
  process.exitCode = 0;
} catch (error) {
  // Avoid logging raw error objects that could contain sensitive data.
  console.error(
    "Failed to provision staff:",
    sanitizeLogValue(error?.message || "An unexpected error occurred")
  );

  process.exitCode = 1;
}
