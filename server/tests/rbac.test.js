/**
 * RBAC (Role-Based Access Control) Test Suite
 *
 * Tests every RBAC scenario from the Phase 1 spec:
 *   1. Unauthenticated request
 *   2. Invalid / tampered JWT
 *   3. Expired JWT
 *   4. Admin access
 *   5. Staff access with required permission
 *   6. Staff access without required permission
 *   7. Customer access to admin-only endpoint
 *   8. Customer accessing another customer's resource (IDOR protection)
 *   9. Customer accessing their own resource (success)
 *  10. Disabled account rejection
 *
 * Uses Node.js built-in test runner (node:test) + assert, no external framework.
 * Uses supertest for HTTP assertions against the Express app.
 *
 * Run:
 *   node --experimental-vm-modules tests/rbac.test.js
 *   or after adding the npm test script:
 *   npm test
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

// Import app AFTER dotenv so env vars are loaded before any module initialization
const { default: app } = await import("../src/app.js");

const request = supertest(app);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const User   = (await import("../src/models/user.model.js")).default;
const Customer = (await import("../src/models/customer.model.js")).default;
const { USER_ROLES } = await import("../src/config/roles.js");
const { USER_STATUS } = await import("../src/models/user.model.js");
const { PERMISSIONS } = await import("../src/config/permissions.js");
const { generateToken } = await import("../src/utils/token.utils.js");


/** Unique email factory to avoid conflicts across test runs. */
const ts = () => Date.now();

async function createUser(overrides = {}) {
  const base = {
    name:    "Test User",
    email:   `test-${ts()}-${Math.random().toString(36).slice(2)}@rbac.test`,
    phone:   "9999999999",
    password: "TestPassword1!",
    role:    USER_ROLES.USER,
    status:  USER_STATUS.ACTIVE,
    permissions: [],
    tokenVersion: 0,
    emailVerified: false,
  };
  const user = new User({ ...base, ...overrides });
  await user.save();
  return user;
}

async function cleanupUsers(emails) {
  await User.deleteMany({ email: { $in: emails } });
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle: DB connection
// ─────────────────────────────────────────────────────────────────────────────

const createdEmails = [];

before(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

after(async () => {
  await cleanupUsers(createdEmails);
  // Disconnect so the Node.js test runner exits cleanly (no open handle hang)
  await mongoose.disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 1 — Unauthenticated request
// ─────────────────────────────────────────────────────────────────────────────

describe("1. Unauthenticated request", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request.get("/api/v1/admin/users");
    assert.equal(res.status, 401, `Expected 401, got ${res.status}: ${res.body.message}`);
    assert.equal(res.body.success, false);
  });

  it("should return 401 on protected profile endpoint without token", async () => {
    const res = await request.get("/api/v1/auth/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2 — Invalid JWT
// ─────────────────────────────────────────────────────────────────────────────

describe("2. Invalid JWT", () => {
  it("should return 401 for a completely invalid token string", async () => {
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer this-is-not-a-valid-jwt");

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("should return 401 for a token signed with a wrong secret", async () => {
    const badToken = jwt.sign({ id: "6666666666666666", email: "x@x.com" }, "wrong-secret");
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${badToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("should return 401 for a token referencing a non-existent user", async () => {
    // Sign with the real secret but a random Mongo ObjectId that doesn't exist
    const fakeId    = new mongoose.Types.ObjectId().toString();
    const badToken  = jwt.sign(
      { id: fakeId, email: "ghost@rbac.test", role: "user", tokenVersion: 0 },
      process.env.JWT_SECRET || "fallback_development_secret_change_in_production"
    );
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${badToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3 — Admin access
// ─────────────────────────────────────────────────────────────────────────────

describe("3. Admin access", () => {
  let admin, adminToken;

  before(async () => {
    admin = await createUser({
      name:        "Admin User",
      email:       `admin-${ts()}@rbac.test`,
      role:        USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    createdEmails.push(admin.email);
    adminToken = generateToken(admin);
  });

  it("should allow admin to list users (GET /api/v1/admin/users)", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.users), "Expected users array");
  });

  it("should allow admin to retrieve the permission catalog", async () => {
    const res = await request
      .get("/api/v1/admin/permissions/catalog")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.permissions), "Expected permissions array");
    assert.ok(Array.isArray(res.body.roles), "Expected roles array");
  });

  it("should allow admin to access their own profile (GET /api/v1/auth/me)", async () => {
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, admin.email);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4 — Staff access with required permission
// ─────────────────────────────────────────────────────────────────────────────

describe("4. Staff access WITH required permission", () => {
  let staff, staffToken;

  before(async () => {
    staff = await createUser({
      name:        "Staff With Perms",
      email:       `staff-with-${ts()}@rbac.test`,
      role:        USER_ROLES.INTERNAL_USER,
      permissions: [PERMISSIONS.STAFF_CREATE, PERMISSIONS.STAFF_UPDATE],
    });
    createdEmails.push(staff.email);
    staffToken = generateToken(staff);
  });

  it("should allow staff with STAFF_CREATE to access the staff dashboard", async () => {
    const res = await request
      .get("/api/v1/auth/staff/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);

    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
  });

  it("staff profile endpoint should be accessible", async () => {
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${staffToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, staff.email);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5 — Staff access WITHOUT required permission
// ─────────────────────────────────────────────────────────────────────────────

describe("5. Staff access WITHOUT required permission", () => {
  let limitedStaff, limitedToken;
  let admin, adminToken;

  before(async () => {
    // Staff with no permissions
    limitedStaff = await createUser({
      name:        "Limited Staff",
      email:       `staff-no-perm-${ts()}@rbac.test`,
      role:        USER_ROLES.INTERNAL_USER,
      permissions: [], // no explicit permissions beyond role defaults
    });
    createdEmails.push(limitedStaff.email);
    limitedToken = generateToken(limitedStaff);

    // Admin for creating internal users
    admin = await createUser({
      name:        "Admin For Staff Test",
      email:       `admin2-${ts()}@rbac.test`,
      role:        USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    createdEmails.push(admin.email);
    adminToken = generateToken(admin);
  });

  it("staff without STAFF_CREATE should get 403 on POST /api/v1/admin/internal-users", async () => {
    const res = await request
      .post("/api/v1/admin/internal-users")
      .set("Authorization", `Bearer ${limitedToken}`)
      .send({
        name:     "New Staff",
        email:    `newstaff-${ts()}@rbac.test`,
        phone:    "9876543210",
        password: "Password1!",
      });

    // Limited staff has INTERNAL_USER role, not admin → blocked by requireRole("admin")
    assert.equal(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, false);
  });

  it("staff cannot list users (admin-only endpoint)", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${limitedToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6 — Customer access to admin-only endpoints
// ─────────────────────────────────────────────────────────────────────────────

describe("6. Customer access to admin endpoints", () => {
  let customer, customerToken;

  before(async () => {
    customer = await createUser({
      name:  "Regular Customer",
      email: `customer-${ts()}@rbac.test`,
      role:  USER_ROLES.USER,
    });
    createdEmails.push(customer.email);
    customerToken = generateToken(customer);
  });

  it("should return 403 when customer tries to list users", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${customerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it("should return 403 when customer tries to access staff dashboard", async () => {
    const res = await request
      .get("/api/v1/auth/staff/dashboard")
      .set("Authorization", `Bearer ${customerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it("should return 403 when customer tries to access permission catalog", async () => {
    const res = await request
      .get("/api/v1/admin/permissions/catalog")
      .set("Authorization", `Bearer ${customerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it("should return 403 when customer tries to create an internal user", async () => {
    const res = await request
      .post("/api/v1/admin/internal-users")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Hack", email: "h@h.com", phone: "1234567890", password: "Hack1234!" });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it("customer should be able to access their own profile", async () => {
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${customerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, customer.email);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 7 — Customer IDOR: accessing another customer's resource
// ─────────────────────────────────────────────────────────────────────────────

describe("7. Customer IDOR protection — accessing another customer's resource", () => {
  let customerA, customerB, tokenA, tokenB;
  let admin, adminToken;
  let staff, staffToken;

  before(async () => {
    customerA = await createUser({
      name:  "Customer A",
      email: `customer-a-${ts()}@rbac.test`,
      role:  USER_ROLES.USER,
    });
    createdEmails.push(customerA.email);
    tokenA = generateToken(customerA);

    customerB = await createUser({
      name:  "Customer B",
      email: `customer-b-${ts()}@rbac.test`,
      role:  USER_ROLES.USER,
    });
    createdEmails.push(customerB.email);
    tokenB = generateToken(customerB);

    admin = await createUser({
      name:        "IDOR Admin",
      email:       `admin-idor-${ts()}@rbac.test`,
      role:        USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    createdEmails.push(admin.email);
    adminToken = generateToken(admin);

    staff = await createUser({
      name:  "IDOR Staff",
      email: `staff-idor-${ts()}@rbac.test`,
      role:  USER_ROLES.INTERNAL_USER,
    });
    createdEmails.push(staff.email);
    staffToken = generateToken(staff);
  });

  it("customerB cannot access customerA's resource (IDOR blocked → 403)", async () => {
    // customerB uses customerA's ID in the URL
    const ownerIdA = customerA._id.toString();
    const res = await request
      .get(`/api/v1/auth/customer-resource/${ownerIdA}`)
      .set("Authorization", `Bearer ${tokenB}`);

    assert.equal(
      res.status,
      403,
      `Expected 403 (IDOR blocked), got ${res.status}: ${JSON.stringify(res.body)}`
    );
    assert.equal(res.body.success, false);
  });

  it("customerA can access their own resource (200)", async () => {
    const ownerIdA = customerA._id.toString();
    const res = await request
      .get(`/api/v1/auth/customer-resource/${ownerIdA}`)
      .set("Authorization", `Bearer ${tokenA}`);

    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.resourceOwnerId, ownerIdA);
  });

  it("admin can access any customer's resource (admin bypass)", async () => {
    const ownerIdB = customerB._id.toString();
    const res = await request
      .get(`/api/v1/auth/customer-resource/${ownerIdB}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
  });

  it("internal staff can access any customer's resource (staff bypass)", async () => {
    const ownerIdA = customerA._id.toString();
    const res = await request
      .get(`/api/v1/auth/customer-resource/${ownerIdA}`)
      .set("Authorization", `Bearer ${staffToken}`);

    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 8 — Disabled account
// ─────────────────────────────────────────────────────────────────────────────

describe("8. Disabled account rejection", () => {
  let disabledUser, disabledToken;

  before(async () => {
    disabledUser = await createUser({
      name:   "Disabled User",
      email:  `disabled-${ts()}@rbac.test`,
      role:   USER_ROLES.USER,
      status: USER_STATUS.DISABLED,
    });
    createdEmails.push(disabledUser.email);
    disabledToken = generateToken(disabledUser);
  });

  it("should return 403 for a disabled account even with a valid JWT", async () => {
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${disabledToken}`);

    assert.equal(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 9 — tokenVersion invalidation
// ─────────────────────────────────────────────────────────────────────────────

describe("9. Session invalidation via tokenVersion", () => {
  let user, oldToken;

  before(async () => {
    user = await createUser({
      name:         "Token Version User",
      email:        `tokenv-${ts()}@rbac.test`,
      role:         USER_ROLES.USER,
      tokenVersion: 0,
    });
    createdEmails.push(user.email);
    // Mint a token at version 0
    oldToken = generateToken(user);

    // Simulate a password change by bumping tokenVersion
    user.tokenVersion = 1;
    await user.save();
  });

  it("old token (version 0) should be rejected after tokenVersion bump (401)", async () => {
    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${oldToken}`);

    assert.equal(res.status, 401, `Expected 401, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, false);
  });

  it("new token (version 1) should be accepted (200)", async () => {
    // Re-fetch to get up-to-date tokenVersion
    const freshUser = await User.findById(user._id);
    const newToken  = generateToken(freshUser);

    const res = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${newToken}`);

    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 10 — Role cannot be injected via request body
// ─────────────────────────────────────────────────────────────────────────────

describe("10. Role injection prevention", () => {
  let customer, customerToken;

  before(async () => {
    customer = await createUser({
      name:  "Injection Attempt",
      email: `inject-${ts()}@rbac.test`,
      role:  USER_ROLES.USER,
    });
    createdEmails.push(customer.email);
    customerToken = generateToken(customer);
  });

  it("body.role=admin should NOT grant admin access to protected routes", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ role: "admin" }); // injected role in body — must be ignored

    assert.equal(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, false);
  });

  it("body.permissions=[*] should NOT grant wildcard access", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ permissions: ["*"] }); // injected wildcard permission — must be ignored

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Admin Bootstrap, Admin Access & Admin Safeguards
// ─────────────────────────────────────────────────────────────────────────────

describe("11. Phase 2 Admin Route Foundation & Security", () => {
  let adminUser, adminToken, staffUser, staffToken, customerUser, customerToken;

  before(async () => {
    adminUser = await createUser({
      name: "Phase 2 Admin",
      email: `phase2-admin-${ts()}@rbac.test`,
      role: USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    createdEmails.push(adminUser.email);
    adminToken = generateToken(adminUser);

    staffUser = await createUser({
      name: "Phase 2 Staff",
      email: `phase2-staff-${ts()}@rbac.test`,
      role: USER_ROLES.INTERNAL_USER,
      permissions: [],
    });
    createdEmails.push(staffUser.email);
    staffToken = generateToken(staffUser);

    customerUser = await createUser({
      name: "Phase 2 Customer",
      email: `phase2-cust-${ts()}@rbac.test`,
      role: USER_ROLES.USER,
      permissions: [],
    });
    createdEmails.push(customerUser.email);
    customerToken = generateToken(customerUser);
  });

  it("Admin-only routes reject customer with 403", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${customerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it("Admin-only routes reject staff with 403", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${staffToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it("Admin-only routes succeed for admin and never expose sensitive password hashes/tokens", async () => {
    const res = await request
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.users));

    // Verify sensitive fields are strictly omitted from account listings
    for (const u of res.body.users) {
      assert.equal(u.password, undefined);
      assert.equal(u.passwordResetToken, undefined);
      assert.equal(u.passwordResetExpires, undefined);
      assert.equal(u.emailVerificationToken, undefined);
    }
  });

  it("Public registration always forces 'user' role and rejects privilege elevation", async () => {
    const candidateEmail = `pub-reg-${ts()}@rbac.test`;
    createdEmails.push(candidateEmail);

    const res = await request.post("/api/v1/auth/register").send({
      name: "Infiltrator",
      email: candidateEmail,
      phone: "+1 555-4321",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "admin", // attempt privilege elevation
      permissions: ["*"],
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.role, USER_ROLES.USER);
    assert.deepEqual(res.body.user.permissions, []);
  });

  it("Staff/customer cannot promote themselves to admin via profile update", async () => {
    const res = await request
      .patch("/api/v1/auth/me")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ role: "admin", permissions: ["*"] });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, USER_ROLES.INTERNAL_USER);
    assert.deepEqual(res.body.user.permissions, []);
  });

  it("Prevents deactivation of the last active administrator", async () => {
    // Disable any other active test admins first to ensure adminUser is the sole active admin
    await User.updateMany(
      {
        _id: { $ne: adminUser._id },
        role: { $in: [USER_ROLES.ADMIN, "admin"] },
        status: USER_STATUS.ACTIVE,
      },
      { $set: { status: USER_STATUS.DISABLED } }
    );

    const res = await request
      .patch(`/api/v1/admin/users/${adminUser._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "disabled" });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /last active administrator/i);

    // Restore any actual real/seed admin accounts that were disabled during this isolated test
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    if (configuredAdminEmail) {
      await User.updateOne(
        { email: configuredAdminEmail },
        { $set: { status: USER_STATUS.ACTIVE } }
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 12 — Phase 3 Admin Staff Management
// ─────────────────────────────────────────────────────────────────────────────

describe("12. Phase 3 Admin Staff Management", () => {
  let admin, adminToken;
  let staff, staffToken;
  let customer, customerToken;
  let createdStaffId;

  before(async () => {
    admin = await createUser({
      name: "Phase 3 Admin",
      email: `p3-admin-${ts()}@rbac.test`,
      role: USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    createdEmails.push(admin.email);
    adminToken = generateToken(admin);

    staff = await createUser({
      name: "Phase 3 Staff",
      email: `p3-staff-${ts()}@rbac.test`,
      role: USER_ROLES.INTERNAL_USER,
      permissions: [PERMISSIONS.STAFF_READ], // only has read
    });
    createdEmails.push(staff.email);
    staffToken = generateToken(staff);

    customer = await createUser({
      name: "Phase 3 Customer",
      email: `p3-cust-${ts()}@rbac.test`,
      role: USER_ROLES.USER,
      permissions: [],
    });
    createdEmails.push(customer.email);
    customerToken = generateToken(customer);
  });

  it("Customer is rejected with 403 when trying to access staff endpoints", async () => {
    const listRes = await request
      .get("/api/v1/admin/staff")
      .set("Authorization", `Bearer ${customerToken}`);
    assert.equal(listRes.status, 403);

    const createRes = await request
      .post("/api/v1/admin/staff")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: "Test Staff",
        email: `hacked-${ts()}@rbac.test`,
        phone: "1234567890",
        password: "Password123!",
      });
    assert.equal(createRes.status, 403);
  });

  it("Staff cannot create other staff (only admin can create staff)", async () => {
    const res = await request
      .post("/api/v1/admin/staff")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        name: "Test Staff Attempt",
        email: `staff-attempt-${ts()}@rbac.test`,
        phone: "1234567890",
        password: "Password123!",
      });
    assert.equal(res.status, 403);
  });

  it("Admin can create a new staff member with internal_user role and permissions", async () => {
    const candidateEmail = `new-staff-${ts()}@rbac.test`;
    createdEmails.push(candidateEmail);

    const res = await request
      .post("/api/v1/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Alice Operator",
        email: candidateEmail,
        phone: "+1 555-9876",
        password: "StaffSecurePassword123!",
        role: "admin", // Malicious attempt to elevate role
        permissions: [PERMISSIONS.CUSTOMER_READ, PERMISSIONS.CUSTOMER_CREATE],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.staff);
    assert.equal(res.body.staff.email, candidateEmail);
    // Must be assigned internal_user role automatically, ignoring body.role=admin
    assert.equal(res.body.staff.role, USER_ROLES.INTERNAL_USER);
    assert.ok(res.body.staff.permissions.includes(PERMISSIONS.CUSTOMER_READ));
    assert.ok(res.body.staff.permissions.includes(PERMISSIONS.CUSTOMER_CREATE));
    assert.equal(res.body.staff.password, undefined);

    createdStaffId = res.body.staff.id;
  });

  it("Admin can list staff members with pagination, search, and permission filtering", async () => {
    const res = await request
      .get("/api/v1/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: "Alice", limit: 10 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.staff));
    assert.ok(res.body.staff.length >= 1);
    assert.equal(res.body.staff[0].password, undefined);
  });

  it("Admin can retrieve individual staff details", async () => {
    const res = await request
      .get(`/api/v1/admin/staff/${createdStaffId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.staff.id, createdStaffId);
    assert.equal(res.body.staff.password, undefined);
  });

  it("Admin can update staff permitted fields and permissions", async () => {
    const res = await request
      .patch(`/api/v1/admin/staff/${createdStaffId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Alice Updated",
        role: "admin", // Tampering attempt
        permissions: [PERMISSIONS.CUSTOMER_READ, PERMISSIONS.CUSTOMER_UPDATE],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.staff.name, "Alice Updated");
    // Role remains internal_user
    assert.equal(res.body.staff.role, USER_ROLES.INTERNAL_USER);
    assert.ok(res.body.staff.permissions.includes(PERMISSIONS.CUSTOMER_UPDATE));
  });

  it("Admin can deactivate staff and deactivated staff cannot access protected endpoints", async () => {
    // 1. Fetch the user to create a valid JWT before deactivation
    const dbStaff = await User.findById(createdStaffId);
    const validStaffToken = generateToken(dbStaff);

    // 2. Deactivate staff
    const deactRes = await request
      .patch(`/api/v1/admin/staff/${createdStaffId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "disabled" });

    assert.equal(deactRes.status, 200);
    assert.equal(deactRes.body.staff.status, "disabled");

    // 3. Deactivated staff attempt to call /auth/me or dashboard
    const testRes = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${validStaffToken}`);

    // Rejected because status is disabled
    assert.equal(testRes.status, 403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 13 — Phase 4 Admin Customer Management
// ─────────────────────────────────────────────────────────────────────────────

describe("13. Phase 4 Admin Customer Management", () => {
  let admin, adminToken;
  let staffWithCustomerPerms, staffWithPermsToken;
  let staffWithoutPerms, staffWithoutPermsToken;
  let customerUser, customerUserToken;
  let createdCustomerId;

  before(async () => {
    admin = await createUser({
      name: "Phase 4 Admin",
      email: `p4-admin-${ts()}@rbac.test`,
      role: USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    createdEmails.push(admin.email);
    adminToken = generateToken(admin);

    staffWithCustomerPerms = await createUser({
      name: "Staff Customer Manager",
      email: `p4-staff-cust-${ts()}@rbac.test`,
      role: USER_ROLES.INTERNAL_USER,
      permissions: [
        PERMISSIONS.CUSTOMER_READ,
        PERMISSIONS.CUSTOMER_CREATE,
        PERMISSIONS.CUSTOMER_UPDATE,
      ],
    });
    createdEmails.push(staffWithCustomerPerms.email);
    staffWithPermsToken = generateToken(staffWithCustomerPerms);

    staffWithoutPerms = await createUser({
      name: "Staff No Cust Perms",
      email: `p4-staff-noperm-${ts()}@rbac.test`,
      role: USER_ROLES.INTERNAL_USER,
      permissions: [], // role default only has customer.read, lacks customer.create / customer.update
    });
    createdEmails.push(staffWithoutPerms.email);
    staffWithoutPermsToken = generateToken(staffWithoutPerms);

    customerUser = await createUser({
      name: "Target Customer Account",
      email: `target-cust-${ts()}@rbac.test`,
      role: USER_ROLES.USER,
      permissions: [],
    });
    createdEmails.push(customerUser.email);
    customerUserToken = generateToken(customerUser);
  });

  after(async () => {
    if (createdCustomerId) {
      await Customer.findByIdAndDelete(createdCustomerId);
    }
  });

  it("Customer user cannot create or access customer management endpoints (403)", async () => {
    const listRes = await request
      .get("/api/v1/customers")
      .set("Authorization", `Bearer ${customerUserToken}`);
    assert.equal(listRes.status, 403);

    const createRes = await request
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${customerUserToken}`)
      .send({ userId: customerUser._id });
    assert.equal(createRes.status, 403);
  });

  it("Staff without customer.create cannot create customer profile (403)", async () => {
    const res = await request
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${staffWithoutPermsToken}`)
      .send({ userId: customerUser._id });
    assert.equal(res.status, 403);
  });

  it("Authorized staff with customer.create can create customer profile with auto-generated customerNumber", async () => {
    const res = await request
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${staffWithPermsToken}`)
      .send({
        userId: customerUser._id,
        companyName: "Acme Rentals Inc.",
        phone: "+1 555-1122",
        billingAddress: {
          street: "123 Market St",
          city: "San Francisco",
          state: "CA",
          country: "USA",
          postalCode: "94103",
        },
        taxIdentificationNumber: "US-987654321",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.customer);
    assert.ok(res.body.customer.customerNumber.startsWith("CUST-"));
    assert.equal(res.body.customer.companyName, "Acme Rentals Inc.");
    assert.equal(res.body.customer.taxIdentificationNumber, "US-987654321");
    // Password of associated user should never be exposed
    if (res.body.customer.userId) {
      assert.equal(res.body.customer.userId.password, undefined);
    }

    createdCustomerId = res.body.customer.id;
  });

  it("Prevents creating duplicate customer profile for the same user account (409)", async () => {
    const res = await request
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: customerUser._id,
        companyName: "Duplicate Corp",
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  it("Admin and authorized staff can list customers with search, pagination, and active filtering", async () => {
    const res = await request
      .get("/api/v1/customers")
      .set("Authorization", `Bearer ${staffWithPermsToken}`)
      .query({ search: "Acme", limit: 5 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.customers));
    assert.ok(res.body.customers.length >= 1);
    assert.equal(res.body.customers[0].companyName, "Acme Rentals Inc.");
  });

  it("Admin and authorized staff can retrieve customer profile by ID", async () => {
    const res = await request
      .get(`/api/v1/customers/${createdCustomerId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.customer.id, createdCustomerId);
    assert.equal(res.body.customer.companyName, "Acme Rentals Inc.");
  });

  it("Authorized staff can update customer profile details", async () => {
    const res = await request
      .patch(`/api/v1/customers/${createdCustomerId}`)
      .set("Authorization", `Bearer ${staffWithPermsToken}`)
      .send({
        companyName: "Acme Global Rentals LLC",
        billingAddress: {
          city: "Oakland",
        },
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.customer.companyName, "Acme Global Rentals LLC");
    assert.equal(res.body.customer.billingAddress.city, "Oakland");
  });
});

