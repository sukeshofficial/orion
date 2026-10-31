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
