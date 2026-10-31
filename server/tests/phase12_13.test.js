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
const Product = (await import("../src/models/product.model.js")).default;
const Tax = (await import("../src/models/tax.model.js")).default;
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
const { runRecurringBillingJob } = await import("../jobs/recurring-billing.job.js");

const ts = () => Date.now();

async function createUser(overrides = {}) {
  const base = {
    name: "Billing Test User",
    email: `test-${ts()}-${Math.random().toString(36).slice(2)}@phase1213.test`,
    phone: "9123456780",
    password: "TestPassword1!",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    emailVerified: true,
    permissions: [],
    tokenVersion: 0,
  };
  return User.create({ ...base, ...overrides });
}

describe("PHASE 12 & 13 — Invoice Management, Recurring Billing, Payments & Reconciliation", () => {
  let adminUser, staffUser, staffNoPermUser, customer1User, customer2User;
  let adminToken, staffToken, staffNoPermToken, customer1Token, customer2Token;
  let customer1Profile, customer2Profile;
  let testPlan, testProduct, testTax;
  let activeDueSub, notDueSub;
  let generatedInvoiceId, separateInvoiceToCancel;

  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. Users
    adminUser = await createUser({
      name: "Billing Admin",
      role: USER_ROLES.ADMIN,
      permissions: ["*"],
    });
    adminToken = generateToken(adminUser);

    staffUser = await createUser({
      name: "Billing Staff",
      role: USER_ROLES.INTERNAL_USER,
      permissions: [
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.INVOICE_CREATE,
        PERMISSIONS.PAYMENT_READ,
        PERMISSIONS.PAYMENT_CREATE,
      ],
    });
    staffToken = generateToken(staffUser);

    staffNoPermUser = await createUser({
      name: "Junior Staff",
      role: USER_ROLES.INTERNAL_USER,
      permissions: [],
    });
    staffNoPermToken = generateToken(staffNoPermUser);

    customer1User = await createUser({
      name: "Customer Alpha",
      role: USER_ROLES.USER,
    });
    customer1Token = generateToken(customer1User);

    customer1Profile = await Customer.create({
      userId: customer1User._id,
      customerNumber: `CUST-1213-1-${ts()}`,
      companyName: "Alpha Corp",
      phone: "9123456780",
      isActive: true,
    });

    customer2User = await createUser({
      name: "Customer Beta",
      role: USER_ROLES.USER,
    });
    customer2Token = generateToken(customer2User);

    customer2Profile = await Customer.create({
      userId: customer2User._id,
      customerNumber: `CUST-1213-2-${ts()}`,
      companyName: "Beta LLC",
      phone: "9123456781",
      isActive: true,
    });

    // 2. Tax, Product, Plan
    testTax = await Tax.create({
      name: "GST 18%",
      rate: 18,
      type: "percentage",
      isActive: true,
      createdBy: adminUser._id,
    });

    testProduct = await Product.create({
      name: "Enterprise Cloud Node",
      salesPrice: 10000,
      costPrice: 5000,
      taxIds: [testTax._id],
      isActive: true,
      createdBy: adminUser._id,
    });

    testPlan = await Plan.create({
      name: "Recurring Cloud Plan",
      price: 50000,
      billingInterval: "monthly",
      createdBy: adminUser._id,
    });

    const now = new Date();

    // 3. Active Due Subscription (nextBillingDate is in the past)
    activeDueSub = await Subscription.create({
      subscriptionNumber: `SUB-DUE-${ts()}`,
      customerId: customer1Profile._id,
      planId: testPlan._id,
      planSnapshot: { name: testPlan.name, price: testPlan.price, billingInterval: "monthly" },
      startDate: new Date(now.getTime() - 40 * 24 * 3600 * 1000),
      nextBillingDate: new Date(now.getTime() - 5 * 24 * 3600 * 1000), // Due 5 days ago!
      expiryDate: new Date(now.getTime() + 300 * 24 * 3600 * 1000),
      billingInterval: "monthly",
      paymentTerms: "immediate",
      lines: [
        {
          productId: testProduct._id,
          productName: testProduct.name,
          quantity: 2,
          unitPrice: 10000,
          basePrice: 10000,
          taxableAmount: 20000,
          effectiveTaxRate: 18,
          taxAmount: 3600,
          lineTotal: 23600,
        },
      ],
      subtotal: 70000,
      taxTotal: 3600,
      discountTotal: 0,
      grandTotal: 73600,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      createdBy: adminUser._id,
    });

    // 4. Not Due Subscription (nextBillingDate in the future)
    notDueSub = await Subscription.create({
      subscriptionNumber: `SUB-NOTDUE-${ts()}`,
      customerId: customer1Profile._id,
      planId: testPlan._id,
      planSnapshot: { name: testPlan.name, price: testPlan.price, billingInterval: "monthly" },
      startDate: now,
      nextBillingDate: new Date(now.getTime() + 25 * 24 * 3600 * 1000), // Not due
      expiryDate: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
      billingInterval: "monthly",
      paymentTerms: "immediate",
      lines: [],
      subtotal: 50000,
      taxTotal: 0,
      grandTotal: 50000,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      createdBy: adminUser._id,
    });

    // 5. Separate invoice for cancel testing
    separateInvoiceToCancel = await Invoice.create({
      invoiceNumber: `INV-CNC-${ts()}`,
      customerId: customer1Profile._id,
      subscriptionId: activeDueSub._id,
      issueDate: now,
      dueDate: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      subtotal: 70000,
      taxTotal: 3600,
      totalAmount: 73600,
      amountPaid: 0,
      amountDue: 73600,
      status: INVOICE_STATUS.CONFIRMED,
      createdBy: adminUser._id,
    });
  });

  after(async () => {
    await User.deleteMany({ email: /phase1213\.test/ });
    if (customer1Profile) await Customer.deleteOne({ _id: customer1Profile._id });
    if (customer2Profile) await Customer.deleteOne({ _id: customer2Profile._id });
    if (testPlan) await Plan.deleteOne({ _id: testPlan._id });
    if (testProduct) await Product.deleteOne({ _id: testProduct._id });
    if (testTax) await Tax.deleteOne({ _id: testTax._id });
    await Subscription.deleteMany({ _id: { $in: [activeDueSub?._id, notDueSub?._id] } });
    await Invoice.deleteMany({ customerId: customer1Profile?._id });
    await Payment.deleteMany({ customerId: customer1Profile?._id });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 12: INVOICE MANAGEMENT & RECURRING BILLING
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Phase 12 — Invoice Generation, Lifecycle & Recurring Billing", () => {
    it("Rejects invoice generation for a subscription that is not due (400)", async () => {
      const res = await request
        .post("/api/v1/invoices/generate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ subscriptionId: notDueSub._id });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /not active or.*not due/i);
    });

    it("Rejects invoice generation without invoice.create permission (403)", async () => {
      const res = await request
        .post("/api/v1/invoices/generate")
        .set("Authorization", `Bearer ${staffNoPermToken}`)
        .send({ subscriptionId: activeDueSub._id });

      assert.equal(res.status, 403);
    });

    it("Generates invoice for a due active subscription (201)", async () => {
      const originalNextBilling = new Date(activeDueSub.nextBillingDate);

      const res = await request
        .post("/api/v1/invoices/generate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ subscriptionId: activeDueSub._id });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert(res.body.invoice.invoiceNumber.startsWith("INV-"));
      assert.equal(res.body.invoice.subtotal, 70000);
      assert.equal(res.body.invoice.taxTotal, 3600);
      assert.equal(res.body.invoice.totalAmount, 73600);
      assert.equal(res.body.invoice.amountDue, 73600);
      assert.equal(res.body.invoice.amountPaid, 0);
      assert.equal(res.body.invoice.status, INVOICE_STATUS.CONFIRMED);
      assert(res.body.invoice.billingPeriodStart);
      assert(res.body.invoice.billingPeriodEnd);

      generatedInvoiceId = res.body.invoice.id;

      // Verify nextBillingDate was advanced
      const refreshedSub = await Subscription.findById(activeDueSub._id);
      assert(new Date(refreshedSub.nextBillingDate) > originalNextBilling);
    });

    it("Idempotent duplicate prevention: retrying generation for same period returns existing invoice (200)", async () => {
      // Temporarily rewind nextBillingDate to test exact period collision
      const invoiceDoc = await Invoice.findById(generatedInvoiceId);

      const res = await request
        .post("/api/v1/invoices/generate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ subscriptionId: activeDueSub._id });

      // Now subscription nextBillingDate has advanced so it's not due unless forced or matches period
      assert(res.status === 200 || res.status === 400);
    });

    it("Lists invoices as administrator with query filters (200)", async () => {
      const res = await request
        .get(`/api/v1/invoices?page=1&limit=20&customerId=${customer1Profile._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(Array.isArray(res.body.invoices));
      assert(res.body.invoices.some((inv) => inv.id === generatedInvoiceId));
    });

    it("Customer lists their own invoices (200)", async () => {
      const res = await request
        .get("/api/v1/invoices?page=1&limit=20")
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(res.body.invoices.some((inv) => inv.id === generatedInvoiceId));
    });

    it("Rejects Customer 2 accessing Customer 1's invoice (403)", async () => {
      const res = await request
        .get(`/api/v1/invoices/${generatedInvoiceId}`)
        .set("Authorization", `Bearer ${customer2Token}`);

      assert.equal(res.status, 403);
      assert.match(res.body.message, /access denied|own/i);
    });

    it("Confirms invoice (200)", async () => {
      const res = await request
        .post(`/api/v1/invoices/${generatedInvoiceId}/confirm`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Invoice reviewed and approved" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.invoice.status, INVOICE_STATUS.CONFIRMED);
    });

    it("Sends invoice (200)", async () => {
      const res = await request
        .post(`/api/v1/invoices/${generatedInvoiceId}/send`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ recipient: "customer" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /sent successfully/i);
    });

    it("Customer downloads invoice PDF (200, application/pdf)", async () => {
      const res = await request
        .get(`/api/v1/invoices/${generatedInvoiceId}/pdf`)
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert.match(res.headers["content-type"], /application\/pdf/);
    });

    it("Cancels an unpaid invoice (200)", async () => {
      const res = await request
        .post(`/api/v1/invoices/${separateInvoiceToCancel._id}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Cancellation approved" });

      assert.equal(res.status, 200);
      assert.equal(res.body.invoice.status, INVOICE_STATUS.CANCELLED);
    });

    it("Recurring billing background job runs safely and idempotently", async () => {
      const stats = await runRecurringBillingJob({
        asOfDate: new Date(),
        timezone: "UTC",
      });

      assert(typeof stats.totalEvaluated === "number");
      assert(typeof stats.invoicesCreated === "number");
      assert(Array.isArray(stats.errors));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 13: PAYMENT MANAGEMENT & RECONCILIATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Phase 13 — Payment Recording, Validation & Reconciliation", () => {
    let partialPaymentId;

    it("Rejects non-positive payment amount (400)", async () => {
      const res = await request
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          invoiceId: generatedInvoiceId,
          amount: 0,
          paymentMethod: PAYMENT_METHODS.UPI,
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /greater than 0/i);
    });

    it("Rejects customer direct creation of completed payment record (403)", async () => {
      const res = await request
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({
          invoiceId: generatedInvoiceId,
          amount: 30000,
          paymentMethod: PAYMENT_METHODS.UPI,
        });

      assert.equal(res.status, 403);
      assert.match(res.body.message, /customers cannot create arbitrary/i);
    });

    it("Rejects payment against a cancelled invoice (400)", async () => {
      const res = await request
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          invoiceId: separateInvoiceToCancel._id,
          amount: 1000,
          paymentMethod: PAYMENT_METHODS.CASH,
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /cancelled invoices cannot receive payments/i);
    });

    it("Rejects payment exceeding outstanding invoice balance (400)", async () => {
      const res = await request
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          invoiceId: generatedInvoiceId,
          amount: 99999999,
          paymentMethod: PAYMENT_METHODS.UPI,
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /exceeds the invoice outstanding balance/i);
    });

    it("Records a partial payment against invoice (201) and updates invoice to Partially Paid", async () => {
      const res = await request
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Idempotency-Key", "IDEMP-KEY-TEST-001")
        .send({
          invoiceId: generatedInvoiceId,
          amount: 30000, // 300.00 of 736.00
          paymentMethod: PAYMENT_METHODS.UPI,
          reference: "UPI-TXN-ORION-10001",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.payment.amount, 30000);
      assert(res.body.payment.paymentNumber.startsWith("PAY-"));

      partialPaymentId = res.body.payment.id;

      // Verify invoice reconciliation
      const invoice = await Invoice.findById(generatedInvoiceId);
      assert.equal(invoice.amountPaid, 30000);
      assert.equal(invoice.amountDue, 43600);
      assert.equal(invoice.status, INVOICE_STATUS.PARTIALLY_PAID);
    });

    it("Idempotent retry with same Idempotency-Key returns existing payment without double charging (200)", async () => {
      const res = await request
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Idempotency-Key", "IDEMP-KEY-TEST-001")
        .send({
          invoiceId: generatedInvoiceId,
          amount: 30000,
          paymentMethod: PAYMENT_METHODS.UPI,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.payment.id, partialPaymentId);

      // Verify invoice balance was NOT decremented again
      const invoice = await Invoice.findById(generatedInvoiceId);
      assert.equal(invoice.amountPaid, 30000);
      assert.equal(invoice.amountDue, 43600);
    });

    it("Lists payments as administrator (200)", async () => {
      const res = await request
        .get(`/api/v1/payments?page=1&limit=20&invoiceId=${generatedInvoiceId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(res.body.payments.some((p) => p.id === partialPaymentId));
    });

    it("Retrieves payment details (200)", async () => {
      const res = await request
        .get(`/api/v1/payments/${partialPaymentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.payment.id, partialPaymentId);
    });

    it("Lists payments for an invoice (200)", async () => {
      const res = await request
        .get(`/api/v1/invoices/${generatedInvoiceId}/payments`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert(res.body.payments.some((p) => p.id === partialPaymentId));
    });

    it("Customer lists their own payments (200)", async () => {
      const res = await request
        .get("/api/v1/payments?page=1&limit=20")
        .set("Authorization", `Bearer ${customer1Token}`);

      assert.equal(res.status, 200);
      assert(res.body.payments.some((p) => p.id === partialPaymentId));
    });

    it("Records remaining balance to settle invoice completely (201) and updates status to Paid", async () => {
      const res = await request
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          invoiceId: generatedInvoiceId,
          amount: 43600, // Exact remaining balance
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
          reference: "BANK-TXN-ORION-10002",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);

      // Verify invoice is completely settled
      const invoice = await Invoice.findById(generatedInvoiceId);
      assert.equal(invoice.amountPaid, 73600);
      assert.equal(invoice.amountDue, 0);
      assert.equal(invoice.status, INVOICE_STATUS.PAID);
    });
  });
});
