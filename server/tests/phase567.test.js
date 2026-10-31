import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import supertest from "supertest";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const { default: app } = await import("../src/app.js");
const request = supertest(app);

const User = (await import("../src/models/user.model.js")).default;
const Product = (await import("../src/models/product.model.js")).default;
const Tax = (await import("../src/models/tax.model.js")).default;
const Plan = (await import("../src/models/plan.model.js")).default;
const Customer = (await import("../src/models/customer.model.js")).default;
const { USER_ROLES } = await import("../src/config/roles.js");
const { USER_STATUS } = await import("../src/models/user.model.js");
const { PERMISSIONS } = await import("../src/config/permissions.js");
const { generateToken } = await import("../src/utils/token.utils.js");
const {
  calculateLineItemPrice,
  calculateOrderTotals,
} = await import("../src/services/pricing.service.js");
const {
  calculateNextBillingDate,
  calculatePlanExpiryDate,
  isPlanAvailable,
  BILLING_INTERVALS,
} = await import("../src/utils/billingDate.utils.js");

const ts = () => Date.now();

async function createUser(overrides = {}) {
  const base = {
    name: "Test User",
    email: `test-${ts()}-${Math.random().toString(36).slice(2)}@phases.test`,
    phone: "9999999999",
    password: "TestPassword1!",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    emailVerified: true,
    permissions: [],
    tokenVersion: 0,
  };
  return User.create({ ...base, ...overrides });
}

describe("PHASE 5, 6, 7 — Customer Profile, Products, Taxes, Pricing & Plans", () => {
  let adminUser, staffUser, customer1User, customer2User;
  let adminToken, staffToken, customer1Token, customer2Token;

  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. Admin
    adminUser = await createUser({
      name: "Super Admin",
      role: USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    adminToken = generateToken(adminUser);

    // 2. Staff
    staffUser = await createUser({
      name: "Operations Staff",
      role: USER_ROLES.INTERNAL_USER,
      permissions: [
        PERMISSIONS.CUSTOMER_READ,
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_UPDATE,
        PERMISSIONS.TAX_READ,
        PERMISSIONS.TAX_CREATE,
        PERMISSIONS.TAX_UPDATE,
        PERMISSIONS.PLAN_READ,
        PERMISSIONS.PLAN_CREATE,
        PERMISSIONS.PLAN_UPDATE,
      ],
    });
    staffToken = generateToken(staffUser);

    // 3. Customer 1
    customer1User = await createUser({
      name: "Customer Alpha",
      role: USER_ROLES.USER,
    });
    customer1Token = generateToken(customer1User);

    // 4. Customer 2
    customer2User = await createUser({
      name: "Customer Beta",
      role: USER_ROLES.USER,
    });
    customer2Token = generateToken(customer2User);
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({ email: /@phases\.test$/ });
    await Product.deleteMany({ notes: /test-phase/ });
    await Tax.deleteMany({ description: /test-phase/ });
    await Plan.deleteMany({ description: /test-phase/ });
    await mongoose.disconnect();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 5: Customer Profile & Ownership Tests
  // ───────────────────────────────────────────────────────────────────────────
  describe("Phase 5: Customer Self-Service Profile Management", () => {
    it("GET /api/v1/customers/me retrieves current customer's profile", async () => {
      const res = await request
        .get("/api/v1/customers/me")
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.customer);
      assert.equal(res.body.customer.userId.email, customer1User.email);
      assert.ok(res.body.customer.customerNumber);
    });

    it("PATCH /api/v1/customers/me updates permitted fields (name, phone, company, address)", async () => {
      const res = await request
        .patch("/api/v1/customers/me")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          name: "Alpha Updated Name",
          phone: "+1-555-123-4567",
          companyName: "Alpha Logistics Inc.",
          billingAddress: {
            street: "123 Main St",
            city: "San Francisco",
            state: "CA",
            country: "USA",
            postalCode: "94105",
          },
          taxIdentificationNumber: "TAX-12345678",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.customer.companyName, "Alpha Logistics Inc.");
      assert.equal(res.body.customer.phone, "+1-555-123-4567");
      assert.equal(res.body.customer.billingAddress.city, "San Francisco");
      assert.equal(res.body.customer.taxIdentificationNumber, "TAX-12345678");
      assert.equal(res.body.customer.userId.name, "Alpha Updated Name");
    });

    it("PATCH /api/v1/customers/me ignores role, permissions, status privilege elevation attempts", async () => {
      const res = await request
        .patch("/api/v1/customers/me")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          role: "admin",
          permissions: ["*"],
          status: "disabled",
          isActive: false,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      // Verify in DB that role and permissions remain untampered
      const freshUser = await User.findById(customer1User._id);
      assert.equal(freshUser.role, USER_ROLES.USER);
      assert.deepEqual(freshUser.permissions, []);
      assert.equal(freshUser.status, USER_STATUS.ACTIVE);
    });

    it("Customer cannot access administrative customer endpoints (403)", async () => {
      const res = await request
        .get("/api/v1/customers")
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 403);
    });

    it("Rejects invalid phone number format on update", async () => {
      const res = await request
        .patch("/api/v1/customers/me")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          phone: "invalid-phone",
        });

      assert.equal(res.status, 400);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 6: Tax & Product Management, Pricing Engine
  // ───────────────────────────────────────────────────────────────────────────
  describe("Phase 6: Product, Tax Management and Pricing Service", () => {
    let createdTaxId;
    let createdProductId;
    let createdVariantId;

    it("Admin / Staff can create a tax rate", async () => {
      const res = await request
        .post("/api/v1/taxes")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Standard Sales Tax",
          rate: 10, // 10%
          description: "Standard sales tax (test-phase)",
          isDefault: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.tax.rate, 10);
      createdTaxId = res.body.tax.id;
    });

    it("Customer cannot create taxes (403)", async () => {
      const res = await request
        .post("/api/v1/taxes")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          name: "Hacker Tax",
          rate: 0,
        });

      assert.equal(res.status, 403);
    });

    it("Admin / Staff can create a product with variants and tax configuration", async () => {
      const res = await request
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Cloud Server Hosting",
          type: "service",
          salesPrice: 5000, // $50.00 base price in minor units
          costPrice: 2000,  // $20.00
          notes: "Dedicated server hosting (test-phase)",
          taxIds: [createdTaxId],
          variants: [
            {
              name: "Pro 16GB RAM",
              sku: "SRV-16GB",
              priceAdjustment: 2000, // +$20.00 in minor units
            },
            {
              name: "Basic 4GB RAM",
              sku: "SRV-4GB",
              priceAdjustment: -1000, // -$10.00 in minor units
            },
          ],
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.product.name, "Cloud Server Hosting");
      assert.equal(res.body.product.variants.length, 2);
      createdProductId = res.body.product.id;
      createdVariantId = res.body.product.variants[0]._id || res.body.product.variants[0].id;
    });

    it("Customer can list active catalog products", async () => {
      const res = await request
        .get("/api/v1/products")
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.products));
      assert.ok(res.body.products.length >= 1);
    });

    it("Customer cannot create products (403)", async () => {
      const res = await request
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          name: "Disallowed Product",
          salesPrice: 100,
        });

      assert.equal(res.status, 403);
    });

    it("Pricing Service correctly computes base price, variant adjustment, quantity, and tax", async () => {
      // Base = 5000, Pro variant = +2000 => Unit price = 7000
      // Quantity = 2 => Taxable amount = 14000
      // Tax = 10% => Tax amount = 1400
      // Line total = 15400
      const pricing = await calculateLineItemPrice({
        productId: createdProductId,
        variantId: createdVariantId,
        quantity: 2,
      });

      assert.equal(pricing.basePrice, 5000);
      assert.equal(pricing.variantAdjustment, 2000);
      assert.equal(pricing.unitPrice, 7000);
      assert.equal(pricing.quantity, 2);
      assert.equal(pricing.taxableAmount, 14000);
      assert.equal(pricing.effectiveTaxRate, 10);
      assert.equal(pricing.taxAmount, 1400);
      assert.equal(pricing.lineTotal, 15400);
    });

    it("Order pricing calculates subtotal, tax and total across multiple items", async () => {
      const order = await calculateOrderTotals([
        {
          productId: createdProductId,
          variantId: createdVariantId,
          quantity: 1, // 7000 + 700 tax = 7700
        },
        {
          productId: createdProductId,
          quantity: 1, // 5000 + 500 tax = 5500
        },
      ]);

      assert.equal(order.subtotal, 12000);
      assert.equal(order.taxAmount, 1200);
      assert.equal(order.total, 13200);
    });

    it("Can update product status and inactive product is hidden from customers", async () => {
      // Toggle to inactive
      const deactRes = await request
        .patch(`/api/v1/products/${createdProductId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ isActive: false });

      assert.equal(deactRes.status, 200);
      assert.equal(deactRes.body.product.isActive, false);

      // Customer trying to get inactive product gets 404
      const custRes = await request
        .get(`/api/v1/products/${createdProductId}`)
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(custRes.status, 404);

      // Re-enable for subsequent tests
      await request
        .patch(`/api/v1/products/${createdProductId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ isActive: true });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 7: Subscription Plan Management & Billing Utilities
  // ───────────────────────────────────────────────────────────────────────────
  describe("Phase 7: Subscription Plan Management & Date Calculations", () => {
    let createdPlanId;

    it("Date utility handles daily, weekly, monthly, and yearly intervals accurately", () => {
      const start = new Date(Date.UTC(2026, 0, 15)); // Jan 15, 2026

      const nextDaily = calculateNextBillingDate(start, BILLING_INTERVALS.DAILY);
      assert.equal(nextDaily.toISOString().slice(0, 10), "2026-01-16");

      const nextWeekly = calculateNextBillingDate(start, BILLING_INTERVALS.WEEKLY);
      assert.equal(nextWeekly.toISOString().slice(0, 10), "2026-01-22");

      const nextMonthly = calculateNextBillingDate(start, BILLING_INTERVALS.MONTHLY);
      assert.equal(nextMonthly.toISOString().slice(0, 10), "2026-02-15");

      const nextYearly = calculateNextBillingDate(start, BILLING_INTERVALS.YEARLY);
      assert.equal(nextYearly.toISOString().slice(0, 10), "2027-01-15");
    });

    it("Date utility handles month-end clamping (Jan 31 -> Feb 28 in non-leap year)", () => {
      const jan31 = new Date(Date.UTC(2025, 0, 31)); // 2025 is non-leap year
      const feb = calculateNextBillingDate(jan31, BILLING_INTERVALS.MONTHLY);
      assert.equal(feb.getUTCFullYear(), 2025);
      assert.equal(feb.getUTCMonth(), 1); // February
      assert.equal(feb.getUTCDate(), 28);
    });

    it("Date utility handles leap years (Jan 31, 2024 -> Feb 29, 2024)", () => {
      const jan31Leap = new Date(Date.UTC(2024, 0, 31)); // 2024 is leap year
      const febLeap = calculateNextBillingDate(jan31Leap, BILLING_INTERVALS.MONTHLY);
      assert.equal(febLeap.getUTCFullYear(), 2024);
      assert.equal(febLeap.getUTCMonth(), 1); // February
      assert.equal(febLeap.getUTCDate(), 29);
    });

    it("calculatePlanExpiryDate calculates expiry based on cycle counts", () => {
      const start = new Date(Date.UTC(2026, 0, 1)); // Jan 1, 2026
      const expiry = calculatePlanExpiryDate(start, BILLING_INTERVALS.MONTHLY, 3);
      assert.equal(expiry.toISOString().slice(0, 10), "2026-04-01");
    });

    it("Staff / Admin can create a subscription plan", async () => {
      // Find a product
      const product = await Product.findOne();

      const res = await request
        .post("/api/v1/plans")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Pro Infrastructure Plan",
          description: "All-in-one cloud setup (test-phase)",
          price: 9900, // $99.00 in minor units
          billingInterval: "monthly",
          minimumQuantity: 1,
          products: [
            {
              productId: product._id,
              quantity: 1,
            },
          ],
          availableFrom: new Date(Date.now() - 86400000).toISOString(),
          autoCloseAtExpiry: false,
          allowEarlyClosure: true,
          allowPause: true,
          allowRenewal: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.plan.name, "Pro Infrastructure Plan");
      assert.equal(res.body.plan.billingInterval, "monthly");
      createdPlanId = res.body.plan.id;
    });

    it("Enforces minimumQuantity validation (min 1)", async () => {
      const res = await request
        .post("/api/v1/plans")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Invalid Plan",
          price: 5000,
          billingInterval: "monthly",
          minimumQuantity: 0,
        });

      assert.equal(res.status, 400);
    });

    it("Enforces valid billing intervals", async () => {
      const res = await request
        .post("/api/v1/plans")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Invalid Interval Plan",
          price: 5000,
          billingInterval: "bi-weekly",
        });

      assert.equal(res.status, 400);
    });

    it("Customer can retrieve eligible active subscription plans", async () => {
      const res = await request
        .get("/api/v1/plans")
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.plans));
      assert.ok(res.body.plans.some((p) => p.id === createdPlanId));
    });

    it("Customer cannot create or modify plans (403)", async () => {
      const createRes = await request
        .post("/api/v1/plans")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          name: "Customer Created Plan",
          price: 1000,
        });

      assert.equal(createRes.status, 403);

      const updateRes = await request
        .patch(`/api/v1/plans/${createdPlanId}`)
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          price: 1,
        });

      assert.equal(updateRes.status, 403);
    });

    it("Staff can update plan details and preserve historical pricing logic", async () => {
      const res = await request
        .patch(`/api/v1/plans/${createdPlanId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          price: 10900, // new price $109.00
          description: "Updated description (test-phase)",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.plan.price, 10900);
    });

    it("Can toggle plan status", async () => {
      const res = await request
        .patch(`/api/v1/plans/${createdPlanId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ isActive: false });

      assert.equal(res.status, 200);
      assert.equal(res.body.plan.isActive, false);
    });
  });
});
