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
const QuotationTemplate = (await import("../src/models/quotationTemplate.model.js")).default;
const Quotation = (await import("../src/models/quotation.model.js")).default;
const Subscription = (await import("../src/models/subscription.model.js")).default;
const Discount = (await import("../src/models/discount.model.js")).default;

const { USER_ROLES } = await import("../src/config/roles.js");
const { USER_STATUS } = await import("../src/models/user.model.js");
const { PERMISSIONS } = await import("../src/config/permissions.js");
const { generateToken } = await import("../src/utils/token.utils.js");
const { QUOTATION_STATUS } = await import("../src/models/quotation.model.js");
const { SUBSCRIPTION_STATUS } = await import("../src/models/subscription.model.js");
const { DISCOUNT_TYPES, DISCOUNT_APPLIES_TO } = await import("../src/models/discount.model.js");
const {
  validateDiscountEligibility,
  calculateFixedDiscount,
  calculatePercentageDiscount,
} = await import("../src/services/discount.service.js");

const ts = () => Date.now();

async function createUser(overrides = {}) {
  const base = {
    name: "Test User",
    email: `test-${ts()}-${Math.random().toString(36).slice(2)}@phases811.test`,
    phone: "9876543210",
    password: "TestPassword1!",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    emailVerified: true,
    permissions: [],
    tokenVersion: 0,
  };
  return User.create({ ...base, ...overrides });
}

describe("PHASE 8, 9, 10, 11 — Templates, Quotations, Subscriptions & Discounts", () => {
  let adminUser, staffUser, staffNoPermUser, customer1User, customer2User;
  let adminToken, staffToken, staffNoPermToken, customer1Token, customer2Token;
  let customer1Profile, customer2Profile;
  let testTax, testProduct, testPlan;

  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. Admin
    adminUser = await createUser({
      name: "Admin Boss",
      role: USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    adminToken = generateToken(adminUser);

    // 2. Staff with permissions
    staffUser = await createUser({
      name: "Sales Staff",
      role: USER_ROLES.INTERNAL_USER,
      permissions: [
        PERMISSIONS.QUOTATION_READ,
        PERMISSIONS.QUOTATION_CREATE,
        PERMISSIONS.QUOTATION_UPDATE,
        PERMISSIONS.SUBSCRIPTION_READ,
        PERMISSIONS.SUBSCRIPTION_CREATE,
        PERMISSIONS.SUBSCRIPTION_UPDATE,
        PERMISSIONS.DISCOUNT_READ,
        PERMISSIONS.DISCOUNT_CREATE,
        PERMISSIONS.DISCOUNT_UPDATE,
        PERMISSIONS.PLAN_READ,
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.CUSTOMER_READ,
      ],
    });
    staffToken = generateToken(staffUser);

    // 3. Staff without permissions
    staffNoPermUser = await createUser({
      name: "Junior Staff",
      role: USER_ROLES.INTERNAL_USER,
      permissions: [],
    });
    staffNoPermToken = generateToken(staffNoPermUser);

    // 4. Customers
    customer1User = await createUser({
      name: "Customer One",
      role: USER_ROLES.USER,
    });
    customer1Token = generateToken(customer1User);

    customer1Profile = await Customer.create({
      userId: customer1User._id,
      customerNumber: `CUST-${ts()}-1`,
      companyName: "Acme Corp",
      phone: "9876543210",
      isActive: true,
    });

    customer2User = await createUser({
      name: "Customer Two",
      role: USER_ROLES.USER,
    });
    customer2Token = generateToken(customer2User);

    customer2Profile = await Customer.create({
      userId: customer2User._id,
      customerNumber: `CUST-${ts()}-2`,
      companyName: "Beta LLC",
      phone: "9876543211",
      isActive: true,
    });

    // 5. Seed Tax, Product, and Plan
    testTax = await Tax.create({
      name: "GST 18%",
      rate: 18,
      type: "percentage",
      isActive: true,
      createdBy: adminUser._id,
    });

    testProduct = await Product.create({
      name: "Enterprise Cloud Node",
      type: "service",
      salesPrice: 10000, // 100.00
      costPrice: 5000,
      taxIds: [testTax._id],
      variants: [
        {
          name: "High Memory",
          priceAdjustment: 2000, // +20.00
          isActive: true,
        },
      ],
      isActive: true,
      createdBy: adminUser._id,
    });

    testPlan = await Plan.create({
      name: "SaaS Pro Monthly",
      price: 50000, // 500.00
      billingInterval: "monthly",
      products: [
        {
          productId: testProduct._id,
          quantity: 1,
        },
      ],
      allowPause: true,
      allowRenewal: true,
      allowEarlyClosure: true,
      isActive: true,
      createdBy: adminUser._id,
    });
  });

  after(async () => {
    await User.deleteMany({ email: /phases811\.test/ });
    if (customer1Profile) await Customer.deleteOne({ _id: customer1Profile._id });
    if (customer2Profile) await Customer.deleteOne({ _id: customer2Profile._id });
    if (testTax) await Tax.deleteOne({ _id: testTax._id });
    if (testProduct) await Product.deleteOne({ _id: testProduct._id });
    if (testPlan) await Plan.deleteOne({ _id: testPlan._id });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: QUOTATION TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Phase 8 — Quotation Templates", () => {
    let createdTemplateId;

    it("Rejects customer attempting to create quotation template with 403", async () => {
      const res = await request
        .post("/api/v1/quotation-templates")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          name: "Unauthorized Template",
          planId: testPlan._id,
          validityDays: 30,
        });

      assert.equal(res.status, 403);
    });

    it("Rejects staff lacking quotation.create permission with 403", async () => {
      const res = await request
        .post("/api/v1/quotation-templates")
        .set("Authorization", `Bearer ${staffNoPermToken}`)
        .send({
          name: "No-Perm Template",
          planId: testPlan._id,
          validityDays: 30,
        });

      assert.equal(res.status, 403);
    });

    it("Validates plan reference when creating template", async () => {
      const fakePlanId = new mongoose.Types.ObjectId();
      const res = await request
        .post("/api/v1/quotation-templates")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Invalid Plan Template",
          planId: fakePlanId,
          validityDays: 30,
        });

      assert.equal(res.status, 404);
      assert.match(res.body.message, /plan not found/i);
    });

    it("Validates product reference and quantities when creating template", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();
      const res = await request
        .post("/api/v1/quotation-templates")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Invalid Product Template",
          planId: testPlan._id,
          productLines: [{ productId: fakeProductId, quantity: 1 }],
          validityDays: 30,
        });

      assert.equal(res.status, 404);
      assert.match(res.body.message, /product/i);
    });

    it("Allows authorized staff to create a quotation template (201)", async () => {
      const res = await request
        .post("/api/v1/quotation-templates")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Standard Pro Onboarding Template",
          planId: testPlan._id,
          productLines: [
            {
              productId: testProduct._id,
              quantity: 2,
            },
          ],
          validityDays: 45,
          isActive: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.template.name, "Standard Pro Onboarding Template");
      assert.equal(res.body.template.validityDays, 45);
      assert.equal(res.body.template.productLines.length, 1);
      createdTemplateId = res.body.template.id;
    });

    it("Lists quotation templates (200)", async () => {
      const res = await request
        .get("/api/v1/quotation-templates")
        .set("Authorization", `Bearer ${staffToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(Array.isArray(res.body.templates));
      assert(res.body.templates.some((t) => t.id === createdTemplateId));
    });

    it("Retrieves a quotation template by ID (200)", async () => {
      const res = await request
        .get(`/api/v1/quotation-templates/${createdTemplateId}`)
        .set("Authorization", `Bearer ${staffToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.template.id, createdTemplateId);
    });

    it("Updates a quotation template (200)", async () => {
      const res = await request
        .patch(`/api/v1/quotation-templates/${createdTemplateId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Updated Pro Template",
          validityDays: 60,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.template.name, "Updated Pro Template");
      assert.equal(res.body.template.validityDays, 60);
    });

    it("Prevents inactive templates from being used for new quotations", async () => {
      // Deactivate template
      await QuotationTemplate.findByIdAndUpdate(createdTemplateId, { isActive: false });

      const res = await request
        .post("/api/v1/quotations")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          customerId: customer1Profile._id,
          templateId: createdTemplateId,
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /inactive/i);

      // Reactivate for subsequent tests
      await QuotationTemplate.findByIdAndUpdate(createdTemplateId, { isActive: true });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 11: DISCOUNT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Phase 11 — Discount Management", () => {
    let fixedDiscountId, percentDiscountId;

    it("Unit tests discount calculation utilities", () => {
      assert.equal(calculateFixedDiscount(500, 1000), 500);
      assert.equal(calculateFixedDiscount(1500, 1000), 1000); // capped at eligible
      assert.equal(calculatePercentageDiscount(10, 1000), 100);
      assert.equal(calculatePercentageDiscount(25, 2000), 500);
    });

    it("Validates discount eligibility (dates, min purchase, usage limits)", () => {
      const discount = {
        name: "Promo 10",
        isActive: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        minimumPurchase: 1000,
        minimumQuantity: 2,
        usageLimit: 5,
        usageCount: 0,
      };

      const validContext = {
        subtotal: 1500,
        lines: [{ quantity: 2, taxableAmount: 1500 }],
      };
      assert.equal(validateDiscountEligibility(discount, validContext).eligible, true);

      // Test below min purchase
      assert.equal(
        validateDiscountEligibility(discount, { subtotal: 500, lines: [{ quantity: 2 }] }).eligible,
        false
      );

      // Test below min quantity
      assert.equal(
        validateDiscountEligibility(discount, { subtotal: 1500, lines: [{ quantity: 1 }] }).eligible,
        false
      );

      // Test expired
      const expiredDiscount = { ...discount, endDate: new Date(Date.now() - 10000) };
      assert.equal(validateDiscountEligibility(expiredDiscount, validContext).eligible, false);

      // Test usage limit reached
      const limitReachedDiscount = { ...discount, usageCount: 5 };
      assert.equal(validateDiscountEligibility(limitReachedDiscount, validContext).eligible, false);
    });

    it("Creates fixed discount (201)", async () => {
      const res = await request
        .post("/api/v1/discounts")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Welcome $50 Off",
          code: "WELCOME50",
          type: DISCOUNT_TYPES.FIXED,
          value: 5000, // 50.00
          minimumPurchase: 10000,
          appliesTo: DISCOUNT_APPLIES_TO.SUBSCRIPTION,
          usageLimit: 10,
          isActive: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.discount.code, "WELCOME50");
      assert.equal(res.body.discount.value, 5000);
      fixedDiscountId = res.body.discount.id;
    });

    it("Creates percentage discount (201)", async () => {
      const res = await request
        .post("/api/v1/discounts")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Summer 10% Off",
          code: "SUMMER10",
          type: DISCOUNT_TYPES.PERCENTAGE,
          value: 10, // 10%
          minimumPurchase: 2000,
          appliesTo: DISCOUNT_APPLIES_TO.SUBSCRIPTION,
          isActive: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.discount.value, 10);
      percentDiscountId = res.body.discount.id;
    });

    it("Lists discounts with pagination and search (200)", async () => {
      const res = await request
        .get("/api/v1/discounts?search=Summer")
        .set("Authorization", `Bearer ${staffToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(res.body.discounts.some((d) => d.id === percentDiscountId));
    });

    it("Updates discount status (200)", async () => {
      const res = await request
        .patch(`/api/v1/discounts/${percentDiscountId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ isActive: false });

      assert.equal(res.status, 200);
      assert.equal(res.body.discount.isActive, false);

      // Reactivate
      await request
        .patch(`/api/v1/discounts/${percentDiscountId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ isActive: true });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 9: QUOTATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Phase 9 — Quotation Management", () => {
    let createdQuotationId, createdQuotationNumber;
    let templateDoc;

    before(async () => {
      templateDoc = await QuotationTemplate.findOne({ name: "Updated Pro Template" });
    });

    it("Creates a quotation with calculations, tax breakdown, and snapshots (201)", async () => {
      const res = await request
        .post("/api/v1/quotations")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          customerId: customer1Profile._id,
          templateId: templateDoc?._id,
          planId: testPlan._id,
          lines: [
            {
              productId: testProduct._id,
              quantity: 2,
            },
          ],
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert(res.body.quotation.quotationNumber.startsWith("QUOT-"));
      assert.equal(res.body.quotation.status, QUOTATION_STATUS.QUOTATION);

      // Plan price is 50000 (500.00). 2 products at 10000 = 20000. Subtotal = 70000.
      // Product tax is 18% on 20000 = 3600.
      // Grand total = 70000 + 3600 = 73600.
      assert.equal(res.body.quotation.subtotal, 70000);
      assert.equal(res.body.quotation.taxTotal, 3600);
      assert.equal(res.body.quotation.grandTotal, 73600);
      assert(res.body.quotation.lines.length >= 1);
      assert.equal(res.body.quotation.lines[0].taxBreakdown.length, 1);

      createdQuotationId = res.body.quotation.id;
      createdQuotationNumber = res.body.quotation.quotationNumber;
    });

    it("Customer can list their own quotations (200)", async () => {
      const res = await request
        .get("/api/v1/quotations")
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert(res.body.quotations.some((q) => q.id === createdQuotationId));
    });

    it("Customer 2 cannot view Customer 1's quotation (403)", async () => {
      const res = await request
        .get(`/api/v1/quotations/${createdQuotationId}`)
        .set("Authorization", `Bearer ${customer2Token}`);

      assert.equal(res.status, 403);
      assert.match(res.body.message, /access denied|own/i);
    });

    it("Customer cannot modify quotation lines or pricing (403)", async () => {
      const res = await request
        .patch(`/api/v1/quotations/${createdQuotationId}`)
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          lines: [{ productId: testProduct._id, quantity: 10 }],
        });

      assert.equal(res.status, 403);
    });

    it("Customer confirms their quotation (200)", async () => {
      const res = await request
        .post(`/api/v1/quotations/${createdQuotationId}/confirm`)
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ reason: "Customer approved order" });

      assert.equal(res.status, 200);
      assert.equal(res.body.quotation.status, QUOTATION_STATUS.CONFIRMED);
    });

    it("Prevents confirming an expired quotation (400)", async () => {
      // Create expired quotation directly
      const expiredQuotation = await Quotation.create({
        quotationNumber: `QUOT-EXP-${ts()}`,
        customerId: customer1Profile._id,
        planId: testPlan._id,
        startDate: new Date(Date.now() - 100000000),
        expiryDate: new Date(Date.now() - 1000),
        subtotal: 10000,
        taxTotal: 1800,
        grandTotal: 11800,
        status: QUOTATION_STATUS.QUOTATION,
        createdBy: adminUser._id,
      });

      const res = await request
        .post(`/api/v1/quotations/${expiredQuotation._id}/confirm`)
        .set("Authorization", `Bearer ${staffToken}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /expired/i);

      await Quotation.deleteOne({ _id: expiredQuotation._id });
    });

    it("Cancels a quotation (200)", async () => {
      // Create fresh quotation to cancel
      const quotToCancel = await Quotation.create({
        quotationNumber: `QUOT-CNC-${ts()}`,
        customerId: customer1Profile._id,
        planId: testPlan._id,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000),
        subtotal: 10000,
        taxTotal: 0,
        grandTotal: 10000,
        status: QUOTATION_STATUS.QUOTATION,
        createdBy: adminUser._id,
      });

      const res = await request
        .post(`/api/v1/quotations/${quotToCancel._id}/cancel`)
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.quotation.status, QUOTATION_STATUS.CANCELLED);

      await Quotation.deleteOne({ _id: quotToCancel._id });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 10: SUBSCRIPTION LIFECYCLE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Phase 10 — Subscription Lifecycle Management", () => {
    let confirmedQuotation;
    let convertedSubscriptionId;

    before(async () => {
      // Create and confirm a fresh quotation
      confirmedQuotation = await Quotation.create({
        quotationNumber: `QUOT-CNV-${ts()}`,
        customerId: customer1Profile._id,
        planId: testPlan._id,
        planSnapshot: {
          id: testPlan._id.toString(),
          name: testPlan.name,
          price: testPlan.price,
          billingInterval: testPlan.billingInterval,
          allowPause: true,
          allowRenewal: true,
          allowEarlyClosure: true,
        },
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 86400000 * 30),
        lines: [
          {
            productId: testProduct._id,
            productName: testProduct.name,
            quantity: 1,
            unitPrice: 10000,
            basePrice: 10000,
            taxableAmount: 10000,
            taxAmount: 1800,
            lineTotal: 11800,
          },
        ],
        subtotal: 60000,
        taxTotal: 1800,
        grandTotal: 61800,
        status: QUOTATION_STATUS.CONFIRMED,
        createdBy: staffUser._id,
      });
    });

    after(async () => {
      if (confirmedQuotation) await Quotation.deleteOne({ _id: confirmedQuotation._id });
      if (convertedSubscriptionId) await Subscription.deleteOne({ _id: convertedSubscriptionId });
    });

    it("Converts a confirmed quotation into a subscription (201)", async () => {
      const res = await request
        .post(`/api/v1/quotations/${confirmedQuotation._id}/convert`)
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert(res.body.subscription.subscriptionNumber.startsWith("SUB-"));
      assert.equal(res.body.subscription.status, SUBSCRIPTION_STATUS.CONFIRMED);
      assert.equal(res.body.subscription.subtotal, 60000);
      assert.equal(res.body.subscription.grandTotal, 61800);

      convertedSubscriptionId = res.body.subscription.id;

      // Verify quotation references subscription
      const updatedQuotation = await Quotation.findById(confirmedQuotation._id);
      assert.equal(
        updatedQuotation.convertedToSubscriptionId.toString(),
        convertedSubscriptionId
      );
    });

    it("Prevents duplicate conversion of the same quotation (400)", async () => {
      const res = await request
        .post(`/api/v1/quotations/${confirmedQuotation._id}/convert`)
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /already been converted/i);
    });

    it("Rejects arbitrary status change via PATCH /subscriptions/:id (400)", async () => {
      const res = await request
        .patch(`/api/v1/subscriptions/${convertedSubscriptionId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: SUBSCRIPTION_STATUS.ACTIVE });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /direct status modification.*forbidden/i);
    });

    it("Activates subscription: Confirmed → Active (200)", async () => {
      const res = await request
        .post(`/api/v1/subscriptions/${convertedSubscriptionId}/activate`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ reason: "Payment processed" });

      assert.equal(res.status, 200);
      assert.equal(res.body.subscription.status, SUBSCRIPTION_STATUS.ACTIVE);
      assert(res.body.subscription.nextBillingDate);
    });

    it("Customer pauses their active subscription (200)", async () => {
      const res = await request
        .post(`/api/v1/subscriptions/${convertedSubscriptionId}/pause`)
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ reason: "Temporary hiatus" });

      assert.equal(res.status, 200);
      assert.equal(res.body.subscription.status, SUBSCRIPTION_STATUS.PAUSED);
      assert(res.body.subscription.pausedAt);
    });

    it("Customer resumes their paused subscription (200)", async () => {
      const res = await request
        .post(`/api/v1/subscriptions/${convertedSubscriptionId}/resume`)
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ reason: "Back in service" });

      assert.equal(res.status, 200);
      assert.equal(res.body.subscription.status, SUBSCRIPTION_STATUS.ACTIVE);
      assert.equal(res.body.subscription.pausedAt, null);
    });

    it("Customer 2 cannot view or pause Customer 1's subscription (403)", async () => {
      const res = await request
        .get(`/api/v1/subscriptions/${convertedSubscriptionId}`)
        .set("Authorization", `Bearer ${customer2Token}`);

      assert.equal(res.status, 403);
      assert.match(res.body.message, /access denied|own/i);
    });

    it("Renews subscription extending expiry date (200)", async () => {
      const res = await request
        .post(`/api/v1/subscriptions/${convertedSubscriptionId}/renew`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ reason: "Annual contract extension" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it("Customer closes their subscription where plan rules permit (200)", async () => {
      const res = await request
        .post(`/api/v1/subscriptions/${convertedSubscriptionId}/close`)
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ reason: "No longer needed" });

      assert.equal(res.status, 200);
      assert.equal(res.body.subscription.status, SUBSCRIPTION_STATUS.CLOSED);
      assert(res.body.subscription.closedAt);
    });
  });
});
