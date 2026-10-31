import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import supertest from "supertest";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const { default: app } = await import("../src/app.js");
const request = supertest(app);

const User = (await import("../src/models/user.model.js")).default;
const Customer = (await import("../src/models/customer.model.js")).default;
const Plan = (await import("../src/models/plan.model.js")).default;
const Subscription = (await import("../src/models/subscription.model.js")).default;
const Invoice = (await import("../src/models/invoice.model.js")).default;
const Payment = (await import("../src/models/payment.model.js")).default;

const { USER_ROLES } = await import("../src/config/roles.js");
const { USER_STATUS } = await import("../src/models/user.model.js");
const { PERMISSIONS } = await import("../src/config/permissions.js");
const { generateToken } = await import("../src/utils/token.utils.js");
const { SUBSCRIPTION_STATUS } = await import("../src/models/subscription.model.js");
const { INVOICE_STATUS } = await import("../src/models/invoice.model.js");
const { PAYMENT_STATUS, PAYMENT_METHODS } = await import("../src/models/payment.model.js");

const ts = () => Date.now();

async function createUser(overrides = {}) {
  const base = {
    name: "Analytics Test User",
    email: `test-${ts()}-${Math.random().toString(36).slice(2)}@phase14.test`,
    phone: "9123456789",
    password: "TestPassword1!",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    emailVerified: true,
    permissions: [],
    tokenVersion: 0,
  };
  return User.create({ ...base, ...overrides });
}

describe("PHASE 14 — Analytics and Reporting", () => {
  let adminUser, staffUser, staffNoPermUser, customerUser;
  let adminToken, staffToken, staffNoPermToken, customerToken;
  let testCustomer, testPlan;
  let activeSub, pausedSub, closedSub;
  let paidInvoice, confirmedInvoice, overdueInvoice;
  let payment1, payment2;

  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. Admin
    adminUser = await createUser({
      name: "Analytics Admin",
      role: USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    adminToken = generateToken(adminUser);

    // 2. Staff with analytics.read
    staffUser = await createUser({
      name: "Analytics Staff",
      role: USER_ROLES.INTERNAL_USER,
      permissions: [PERMISSIONS.ANALYTICS_READ],
    });
    staffToken = generateToken(staffUser);

    // 3. Staff without analytics.read
    staffNoPermUser = await createUser({
      name: "Restricted Staff",
      role: USER_ROLES.INTERNAL_USER,
      permissions: [PERMISSIONS.CUSTOMER_READ],
    });
    staffNoPermToken = generateToken(staffNoPermUser);

    // 4. Regular Customer
    customerUser = await createUser({
      name: "Regular Customer",
      role: USER_ROLES.USER,
    });
    customerToken = generateToken(customerUser);

    testCustomer = await Customer.create({
      userId: customerUser._id,
      customerNumber: `CUST-A-${ts()}`,
      companyName: "Analytics Client Co",
      phone: "9123456789",
      isActive: true,
    });

    // 5. Seed Plan
    testPlan = await Plan.create({
      name: "Analytics Enterprise Plan",
      price: 150000,
      billingInterval: "monthly",
      createdBy: adminUser._id,
    });

    const now = new Date();

    // 6. Seed Subscriptions (Active, Paused, Closed)
    activeSub = await Subscription.create({
      subscriptionNumber: `SUB-ACT-${ts()}`,
      customerId: testCustomer._id,
      planId: testPlan._id,
      planSnapshot: { name: testPlan.name, price: testPlan.price },
      startDate: new Date(now.getTime() - 60 * 24 * 3600 * 1000),
      expiryDate: new Date(now.getTime() + 15 * 24 * 3600 * 1000), // renewing in 15 days
      subtotal: 150000,
      taxTotal: 0,
      grandTotal: 150000,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      createdBy: adminUser._id,
    });

    pausedSub = await Subscription.create({
      subscriptionNumber: `SUB-PAU-${ts()}`,
      customerId: testCustomer._id,
      planId: testPlan._id,
      planSnapshot: { name: testPlan.name, price: testPlan.price },
      startDate: new Date(now.getTime() - 40 * 24 * 3600 * 1000),
      expiryDate: new Date(now.getTime() + 50 * 24 * 3600 * 1000),
      subtotal: 150000,
      taxTotal: 0,
      grandTotal: 150000,
      status: SUBSCRIPTION_STATUS.PAUSED,
      pausedAt: new Date(),
      createdBy: adminUser._id,
    });

    closedSub = await Subscription.create({
      subscriptionNumber: `SUB-CLO-${ts()}`,
      customerId: testCustomer._id,
      planId: testPlan._id,
      planSnapshot: { name: testPlan.name, price: testPlan.price },
      startDate: new Date(now.getTime() - 100 * 24 * 3600 * 1000),
      expiryDate: new Date(now.getTime() - 10 * 24 * 3600 * 1000),
      subtotal: 150000,
      taxTotal: 0,
      grandTotal: 150000,
      status: SUBSCRIPTION_STATUS.CLOSED,
      closedAt: new Date(),
      createdBy: adminUser._id,
    });

    // 7. Seed Invoices (Paid, Confirmed with balance, Overdue with balance)
    paidInvoice = await Invoice.create({
      invoiceNumber: `INV-PAID-${ts()}`,
      customerId: testCustomer._id,
      subscriptionId: activeSub._id,
      issueDate: new Date(now.getTime() - 30 * 24 * 3600 * 1000),
      dueDate: new Date(now.getTime() - 15 * 24 * 3600 * 1000),
      subtotal: 50000,
      taxTotal: 9000,
      totalAmount: 59000,
      amountPaid: 59000,
      amountDue: 0,
      status: INVOICE_STATUS.PAID,
      createdBy: adminUser._id,
    });

    confirmedInvoice = await Invoice.create({
      invoiceNumber: `INV-CONF-${ts()}`,
      customerId: testCustomer._id,
      subscriptionId: activeSub._id,
      issueDate: now,
      dueDate: new Date(now.getTime() + 15 * 24 * 3600 * 1000), // due in 15 days
      subtotal: 100000,
      taxTotal: 18000,
      totalAmount: 118000,
      amountPaid: 0,
      amountDue: 118000,
      status: INVOICE_STATUS.CONFIRMED,
      createdBy: adminUser._id,
    });

    overdueInvoice = await Invoice.create({
      invoiceNumber: `INV-OVER-${ts()}`,
      customerId: testCustomer._id,
      subscriptionId: activeSub._id,
      issueDate: new Date(now.getTime() - 45 * 24 * 3600 * 1000),
      dueDate: new Date(now.getTime() - 15 * 24 * 3600 * 1000), // overdue by 15 days
      subtotal: 40000,
      taxTotal: 7200,
      totalAmount: 47200,
      amountPaid: 10000,
      amountDue: 37200, // partially paid, remaining 37200 overdue
      status: INVOICE_STATUS.PARTIALLY_PAID,
      createdBy: adminUser._id,
    });

    // 8. Seed Payments (Actual collected revenue)
    payment1 = await Payment.create({
      paymentNumber: `PAY-001-${ts()}`,
      invoiceId: paidInvoice._id,
      customerId: testCustomer._id,
      amount: 59000,
      paymentMethod: PAYMENT_METHODS.CREDIT_CARD,
      paymentDate: new Date(now.getTime() - 15 * 24 * 3600 * 1000),
      status: PAYMENT_STATUS.COMPLETED,
      createdBy: adminUser._id,
    });

    payment2 = await Payment.create({
      paymentNumber: `PAY-002-${ts()}`,
      invoiceId: overdueInvoice._id,
      customerId: testCustomer._id,
      amount: 10000,
      paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
      paymentDate: new Date(now.getTime() - 20 * 24 * 3600 * 1000),
      status: PAYMENT_STATUS.COMPLETED,
      createdBy: adminUser._id,
    });
  });

  after(async () => {
    await User.deleteMany({ email: /phase14\.test/ });
    if (testCustomer) await Customer.deleteOne({ _id: testCustomer._id });
    if (testPlan) await Plan.deleteOne({ _id: testPlan._id });
    await Subscription.deleteMany({ _id: { $in: [activeSub?._id, pausedSub?._id, closedSub?._id] } });
    await Invoice.deleteMany({ _id: { $in: [paidInvoice?._id, confirmedInvoice?._id, overdueInvoice?._id] } });
    await Payment.deleteMany({ _id: { $in: [payment1?._id, payment2?._id] } });
  });

  describe("Authorization & Security Guards", () => {
    it("Rejects unauthenticated request with 401", async () => {
      const res = await request.get("/api/v1/analytics/overview");
      assert.equal(res.status, 401);
    });

    it("Rejects customer request with 403 Forbidden", async () => {
      const res = await request
        .get("/api/v1/analytics/overview")
        .set("Authorization", `Bearer ${customerToken}`);
      assert.equal(res.status, 403);
    });

    it("Rejects staff without analytics.read permission with 403", async () => {
      const res = await request
        .get("/api/v1/analytics/overview")
        .set("Authorization", `Bearer ${staffNoPermToken}`);
      assert.equal(res.status, 403);
    });

    it("Allows authorized staff with analytics.read to access analytics (200)", async () => {
      const res = await request
        .get("/api/v1/analytics/overview")
        .set("Authorization", `Bearer ${staffToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it("Allows admin to access analytics (200)", async () => {
      const res = await request
        .get("/api/v1/analytics/overview")
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe("GET /api/v1/analytics/overview", () => {
    it("Calculates active subscriptions, revenue collected, outstanding amounts, overdue invoices, and upcoming renewals accurately", async () => {
      const res = await request
        .get("/api/v1/analytics/overview")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Active subscriptions: >= 1
      assert(res.body.activeSubscriptions >= 1);

      // Total collected revenue: payment1 (59000) + payment2 (10000) = 69000
      assert(res.body.totalRevenueCollected >= 69000);

      // Outstanding amounts: confirmedInvoice (118000) + overdueInvoice (37200) = 155200
      assert(res.body.outstandingAmounts >= 155200);

      // Overdue invoices: overdueInvoice amountDue is 37200
      assert(res.body.overdueInvoices.count >= 1);
      assert(res.body.overdueInvoices.amount >= 37200);

      // Upcoming renewals: activeSub renews in 15 days
      assert(res.body.upcomingRenewals >= 1);
    });
  });

  describe("GET /api/v1/analytics/revenue", () => {
    it("Supports revenue grouped by month", async () => {
      const res = await request
        .get("/api/v1/analytics/revenue?groupBy=month")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.groupBy, "month");
      assert(res.body.totalCollected >= 69000);
      assert(Array.isArray(res.body.data));
    });

    it("Supports revenue grouped by day", async () => {
      const res = await request
        .get("/api/v1/analytics/revenue?groupBy=day")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.groupBy, "day");
      assert(Array.isArray(res.body.data));
    });

    it("Supports revenue grouped by quarter and year", async () => {
      const resQuarter = await request
        .get("/api/v1/analytics/revenue?groupBy=quarter")
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(resQuarter.status, 200);
      assert.equal(resQuarter.body.groupBy, "quarter");

      const resYear = await request
        .get("/api/v1/analytics/revenue?groupBy=year")
        .set("Authorization", `Bearer ${adminToken}`);
      assert.equal(resYear.status, 200);
      assert.equal(resYear.body.groupBy, "year");
    });

    it("Applies date range filters correctly", async () => {
      const futureStart = new Date(Date.now() + 100 * 24 * 3600 * 1000).toISOString();
      const res = await request
        .get(`/api/v1/analytics/revenue?startDate=${futureStart}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.totalCollected, 0);
      assert.equal(res.body.data.length, 0);
    });
  });

  describe("GET /api/v1/analytics/subscriptions", () => {
    it("Returns status breakdown, plan breakdown, and upcoming renewals list", async () => {
      const res = await request
        .get("/api/v1/analytics/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(res.body.activeSubscriptions >= 1);
      assert(res.body.closedSubscriptions >= 1);
      assert(res.body.pausedSubscriptions >= 1);
      assert(Array.isArray(res.body.byPlan));
      assert(Array.isArray(res.body.upcomingRenewals));
      assert(res.body.upcomingRenewals.some((s) => s.id === activeSub._id.toString()));
    });
  });

  describe("GET /api/v1/analytics/invoices", () => {
    it("Returns total invoices, confirmed, paid, overdue, and outstanding balances", async () => {
      const res = await request
        .get("/api/v1/analytics/invoices")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(res.body.totalInvoices >= 3);
      assert(res.body.paidInvoices >= 1);
      assert(res.body.confirmedInvoices >= 1);
      assert(res.body.overdueInvoices >= 1);
      assert(res.body.outstandingBalances >= 155200);
    });
  });

  describe("GET /api/v1/analytics/payments", () => {
    it("Returns total payments received, payments grouped by date, and payments grouped by method", async () => {
      const res = await request
        .get("/api/v1/analytics/payments")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(res.body.totalPaymentsReceived >= 69000);
      assert(res.body.paymentCount >= 2);
      assert(Array.isArray(res.body.paymentsGroupedByMethod));
      assert(Array.isArray(res.body.paymentsGroupedByDate));

      const methods = res.body.paymentsGroupedByMethod.map((m) => m.method);
      assert(methods.includes(PAYMENT_METHODS.CREDIT_CARD));
      assert(methods.includes(PAYMENT_METHODS.BANK_TRANSFER));
    });
  });
});
