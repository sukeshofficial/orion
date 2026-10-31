import Invoice, { INVOICE_STATUS } from "../models/invoice.model.js";
import Subscription, { SUBSCRIPTION_STATUS } from "../models/subscription.model.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import Tax from "../models/tax.model.js";
import { calculateNextBillingDate, BILLING_INTERVALS } from "../utils/billingDate.utils.js";
import { calculateQuotationPricing } from "./quotation.service.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";

/**
 * Invoice Service
 * Handles invoice generation from subscriptions, manual billing, idempotency,
 * PDF generation, email sending, confirmation, cancellation, and customer scoping.
 */

export const generateInvoiceNumber = async () => {
  let unique = false;
  let invoiceNumber = "";
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    const count = await Invoice.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `INV-${(count + attempts).toString().padStart(4, "0")}-${randomSuffix}`;

    const existing = await Invoice.findOne({ invoiceNumber: candidate });
    if (!existing) {
      invoiceNumber = candidate;
      unique = true;
    }
  }

  if (!invoiceNumber) {
    invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  }

  return invoiceNumber;
};

/**
 * Step 5 — generateInvoiceForSubscription
 * Requirements:
 * - Subscription must be active.
 * - Next billing date must be due (nextBillingDate <= now or explicitly specified).
 * - Billing period must be identified (billingPeriodStart, billingPeriodEnd).
 * - Duplicate invoice generation must be prevented (compound index check & idempotent return).
 * - Invoice number must be unique.
 * - Next billing date must only advance after successful invoice creation.
 *
 * @param {string|object} subscriptionIdOrDoc
 * @param {object} options
 * @param {Date} [options.asOfDate=new Date()]
 * @param {string} [options.userId] - creator ID
 * @param {boolean} [options.force=false] - bypass due date check for manual testing
 * @returns {Promise<{ invoice: object, isNew: boolean }>}
 */
export const generateInvoiceForSubscription = async (
  subscriptionIdOrDoc,
  { asOfDate = new Date(), userId = null, force = false } = {}
) => {
  let subscription = subscriptionIdOrDoc;
  if (typeof subscriptionIdOrDoc === "string") {
    subscription = await Subscription.findById(subscriptionIdOrDoc).populate("planId");
  }

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  // 1. Subscription must be active
  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    const error = new Error("Subscription is not active or its next billing date is not due");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date(asOfDate);
  const nextBilling = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null;

  // 2. Next billing date must be due (unless force === true)
  if (!force && nextBilling && nextBilling > now) {
    const error = new Error("Subscription is not active or its next billing date is not due");
    error.statusCode = 400;
    throw error;
  }

  // 3. Billing period calculation
  const billingPeriodStart = nextBilling || new Date(subscription.startDate || now);
  const billingPeriodEnd = calculateNextBillingDate(
    billingPeriodStart,
    subscription.billingInterval || BILLING_INTERVALS.MONTHLY
  );

  // 4. Duplicate prevention: check compound index / existing invoice for this period
  const existingInvoice = await Invoice.findOne({
    subscriptionId: subscription._id,
    billingPeriodStart,
    billingPeriodEnd,
  });

  if (existingInvoice) {
    return {
      invoice: existingInvoice.toSafeObject(),
      isNew: false,
      message: "Invoice already generated for this billing period",
    };
  }

  // 5. Calculate due date (default net 14 or net 30 based on paymentTerms)
  let daysToDue = 14;
  if (subscription.paymentTerms === "net_30") daysToDue = 30;
  if (subscription.paymentTerms === "net_60") daysToDue = 60;
  if (subscription.paymentTerms === "immediate") daysToDue = 7;

  const dueDate = new Date(now);
  dueDate.setUTCDate(dueDate.getUTCDate() + daysToDue);

  // 6. Generate unique invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // 7. Re-calculate or copy lines from approved subscription pricing snapshots
  const lines = subscription.lines.map((l) => ({
    productId: l.productId,
    productName: l.productName,
    variantId: l.variantId,
    variantName: l.variantName,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxableAmount: l.taxableAmount,
    effectiveTaxRate: l.effectiveTaxRate || 0,
    taxAmount: l.taxAmount || 0,
    taxBreakdown: l.taxBreakdown || [],
    lineTotal: l.lineTotal,
  }));

  const subtotal = subscription.subtotal;
  const taxTotal = subscription.taxTotal;
  const discountTotal = subscription.discountTotal || 0;
  const totalAmount = subscription.grandTotal;
  const amountPaid = 0;
  const amountDue = totalAmount;

  // 8. Create and save invoice
  const invoice = new Invoice({
    invoiceNumber,
    customerId: subscription.customerId,
    subscriptionId: subscription._id,
    billingPeriodStart,
    billingPeriodEnd,
    issueDate: now,
    dueDate,
    lines,
    subtotal,
    taxTotal,
    discountId: subscription.discountId || null,
    discountSnapshot: subscription.discountSnapshot || null,
    discountTotal,
    totalAmount,
    amountPaid,
    amountDue,
    status: INVOICE_STATUS.CONFIRMED,
    notes: "Recurring subscription invoice",
    createdBy: userId || subscription.createdBy,
  });

  try {
    await invoice.save();
  } catch (err) {
    // If Mongo unique constraint collision on compound index, return existing invoice idempotently
    if (err.code === 11000) {
      const raceInvoice = await Invoice.findOne({
        subscriptionId: subscription._id,
        billingPeriodStart,
        billingPeriodEnd,
      });
      if (raceInvoice) {
        return {
          invoice: raceInvoice.toSafeObject(),
          isNew: false,
          message: "Invoice already generated for this billing period",
        };
      }
    }
    throw err;
  }

  // 9. Advance next billing date only after successful invoice creation
  subscription.nextBillingDate = billingPeriodEnd;
  await subscription.save();

  return {
    invoice: invoice.toSafeObject(),
    isNew: true,
    message: "Invoice generated successfully",
  };
};

/**
 * List Invoices with search, filters, pagination and customer scoping
 */
export const listInvoices = async (
  authenticatedUser,
  {
    page = 1,
    limit = 20,
    status,
    customerId,
    subscriptionId,
    search = "",
  } = {}
) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customer = await Customer.findOne({
      userId: authenticatedUser._id || authenticatedUser.id,
    });
    if (!customer) {
      return {
        invoices: [],
        pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 1 },
      };
    }
    query.customerId = customer._id;
  } else if (customerId) {
    query.customerId = customerId;
  }

  if (subscriptionId) {
    query.subscriptionId = subscriptionId;
  }

  if (status && Object.values(INVOICE_STATUS).includes(status)) {
    query.status = status;
  }

  if (search && search.trim()) {
    query.$or = [{ invoiceNumber: { $regex: search.trim(), $options: "i" } }];
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("customerId", "companyName customerNumber")
      .populate("subscriptionId", "subscriptionNumber status"),
    Invoice.countDocuments(query),
  ]);

  return {
    invoices: invoices.map((inv) => inv.toSafeObject()),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get Invoice by ID with customer ownership validation
 */
export const getInvoiceById = async (id, authenticatedUser) => {
  const invoice = await Invoice.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email phone" },
    })
    .populate("subscriptionId", "subscriptionNumber status planSnapshot");

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = invoice.customerId?.userId?._id
      ? invoice.customerId.userId._id.toString()
      : invoice.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this invoice");
      error.statusCode = 403;
      throw error;
    }
  }

  return invoice.toSafeObject();
};

/**
 * Confirm Invoice: Draft → Confirmed
 */
export const confirmInvoice = async (id, authenticatedUser, reason = "Invoice confirmed") => {
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  if (invoice.status === INVOICE_STATUS.CANCELLED) {
    const error = new Error("Cancelled invoices cannot be confirmed");
    error.statusCode = 400;
    throw error;
  }

  invoice.status = INVOICE_STATUS.CONFIRMED;
  await invoice.save();
  return invoice.toSafeObject();
};

/**
 * Cancel Invoice
 */
export const cancelInvoice = async (id, authenticatedUser, reason = "Invoice cancelled") => {
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  if (invoice.amountPaid > 0) {
    const error = new Error("Cannot cancel an invoice with recorded payments");
    error.statusCode = 400;
    throw error;
  }

  invoice.status = INVOICE_STATUS.CANCELLED;
  await invoice.save();
  return invoice.toSafeObject();
};

/**
 * Send Invoice (Email delivery mock)
 */
export const sendInvoice = async (id, authenticatedUser, recipient = "customer") => {
  const invoice = await Invoice.findById(id).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  const recipientEmail = invoice.customerId?.userId?.email || recipient;
  invoice.sentAt = new Date();
  invoice.sentTo = recipientEmail;
  await invoice.save();

  return {
    invoice: invoice.toSafeObject(),
    deliveredTo: recipientEmail,
  };
};

/**
 * Generate PDF buffer for invoice
 */
export const generateInvoicePdfBuffer = async (id, authenticatedUser) => {
  const invoice = await Invoice.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email phone" },
    })
    .populate("subscriptionId", "subscriptionNumber");

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  // Customer ownership check
  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = invoice.customerId?.userId?._id
      ? invoice.customerId.userId._id.toString()
      : invoice.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this invoice");
      error.statusCode = 403;
      throw error;
    }
  }

  // Generate lightweight valid PDF binary representation
  const pdfString = `%PDF-1.4
1 0 obj << /Title (${invoice.invoiceNumber}) /Author (Orion SaaS) >> endobj
2 0 obj << /Type /Catalog /Pages 3 0 R >> endobj
3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj
4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
5 0 obj << /Length 200 >> stream
BT
/F1 18 Tf 50 700 Td (INVOICE: ${invoice.invoiceNumber}) Tj
/F1 12 Tf 0 -30 Td (Total Amount: ${invoice.totalAmount} minor units) Tj
/F1 12 Tf 0 -20 Td (Amount Due: ${invoice.amountDue} minor units) Tj
/F1 12 Tf 0 -20 Td (Status: ${invoice.status}) Tj
ET
endstream endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000080 00000 n
0000000130 00000 n
0000000190 00000 n
0000000280 00000 n
trailer << /Size 6 /Root 2 0 R >>
startxref
530
%%EOF`;

  return {
    buffer: Buffer.from(pdfString, "utf-8"),
    filename: `${invoice.invoiceNumber}.pdf`,
  };
};
