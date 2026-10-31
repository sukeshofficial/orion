import Payment, { PAYMENT_STATUS, PAYMENT_METHODS } from "../models/payment.model.js";
import Invoice, { INVOICE_STATUS } from "../models/invoice.model.js";
import Customer from "../models/customer.model.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";

/**
 * Payment Service
 * Handles payment recording, idempotency, partial payments, and invoice reconciliation.
 */

export const generatePaymentNumber = async () => {
  let unique = false;
  let paymentNumber = "";
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    const count = await Payment.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `PAY-${(count + attempts).toString().padStart(4, "0")}-${randomSuffix}`;

    const existing = await Payment.findOne({ paymentNumber: candidate });
    if (!existing) {
      paymentNumber = candidate;
      unique = true;
    }
  }

  if (!paymentNumber) {
    paymentNumber = `PAY-${Date.now().toString(36).toUpperCase()}`;
  }

  return paymentNumber;
};

/**
 * Record a payment against an invoice
 *
 * Workflow:
 * 1. Check idempotency key if provided
 * 2. Validate invoice
 * 3. Check invoice eligibility (cannot pay cancelled or already fully paid)
 * 4. Validate payment amount (must be positive, cannot exceed amountDue)
 * 5. Record payment
 * 6. Update invoice amountPaid and amountDue
 * 7. Update invoice status (Paid or Partially Paid)
 */
export const recordPayment = async ({
  invoiceId,
  amount,
  paymentMethod = PAYMENT_METHODS.CREDIT_CARD,
  reference = "",
  notes = "",
  idempotencyKey = null,
  authenticatedUser,
}) => {
  // 1. Idempotency check: if already recorded with same key, return existing payment
  if (idempotencyKey && idempotencyKey.trim()) {
    const existingPayment = await Payment.findOne({
      idempotencyKey: idempotencyKey.trim(),
    });
    if (existingPayment) {
      return {
        payment: existingPayment.toSafeObject(),
        isDuplicate: true,
        message: "Existing payment returned for idempotency key",
      };
    }
  }

  // 2. Validate customer role: customer cannot forge arbitrary completed payments
  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const error = new Error("Customers cannot create arbitrary completed payment records");
    error.statusCode = 403;
    throw error;
  }

  // 3. Validate invoice
  if (!invoiceId) {
    const error = new Error("invoiceId is required");
    error.statusCode = 400;
    throw error;
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  // 4. Cancelled check
  if (invoice.status === INVOICE_STATUS.CANCELLED) {
    const error = new Error("Cancelled invoices cannot receive payments");
    error.statusCode = 400;
    throw error;
  }

  // 5. Positive amount check
  const numAmount = parseInt(amount, 10);
  if (isNaN(numAmount) || numAmount <= 0) {
    const error = new Error("Payment amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  // 6. Overpayment check
  if (numAmount > invoice.amountDue) {
    const error = new Error("Payment amount exceeds the invoice outstanding balance");
    error.statusCode = 400;
    throw error;
  }

  // 7. Atomic update on invoice to prevent concurrent overpayments
  const updatedInvoice = await Invoice.findOneAndUpdate(
    {
      _id: invoice._id,
      amountDue: { $gte: numAmount },
      status: { $ne: INVOICE_STATUS.CANCELLED },
    },
    {
      $inc: { amountPaid: numAmount, amountDue: -numAmount },
    },
    { new: true }
  );

  if (!updatedInvoice) {
    const error = new Error("Payment failed: concurrent transaction modified invoice balance or exceeded amount due");
    error.statusCode = 400;
    throw error;
  }

  // Update invoice status based on remaining balance
  if (updatedInvoice.amountDue === 0) {
    updatedInvoice.status = INVOICE_STATUS.PAID;
  } else {
    updatedInvoice.status = INVOICE_STATUS.PARTIALLY_PAID;
  }
  await updatedInvoice.save();

  // 8. Create payment record
  const paymentNumber = await generatePaymentNumber();
  const payment = new Payment({
    paymentNumber,
    invoiceId: invoice._id,
    customerId: invoice.customerId,
    amount: numAmount,
    paymentMethod: Object.values(PAYMENT_METHODS).includes(paymentMethod)
      ? paymentMethod
      : PAYMENT_METHODS.CREDIT_CARD,
    paymentDate: new Date(),
    status: PAYMENT_STATUS.COMPLETED,
    reference: reference || "",
    notes: notes || "",
    idempotencyKey: idempotencyKey ? idempotencyKey.trim() : undefined,
    createdBy: authenticatedUser._id || authenticatedUser.id,
  });

  await payment.save();

  return {
    payment: payment.toSafeObject(),
    invoice: updatedInvoice.toSafeObject(),
    isDuplicate: false,
    message: "Payment recorded successfully",
  };
};

/**
 * List Payments with filters, search, and customer ownership scoping
 */
export const listPayments = async (
  authenticatedUser,
  {
    page = 1,
    limit = 20,
    invoiceId,
    customerId,
    status,
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
        payments: [],
        pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 1 },
      };
    }
    query.customerId = customer._id;
  } else if (customerId) {
    query.customerId = customerId;
  }

  if (invoiceId) {
    query.invoiceId = invoiceId;
  }

  if (status && Object.values(PAYMENT_STATUS).includes(status)) {
    query.status = status;
  }

  if (search && search.trim()) {
    query.$or = [
      { paymentNumber: { $regex: search.trim(), $options: "i" } },
      { reference: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("customerId", "companyName customerNumber")
      .populate("invoiceId", "invoiceNumber totalAmount status"),
    Payment.countDocuments(query),
  ]);

  return {
    payments: payments.map((p) => p.toSafeObject()),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get Payment by ID
 */
export const getPaymentById = async (id, authenticatedUser) => {
  const payment = await Payment.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email phone" },
    })
    .populate("invoiceId", "invoiceNumber totalAmount status");

  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }

  // Customer ownership check
  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = payment.customerId?.userId?._id
      ? payment.customerId.userId._id.toString()
      : payment.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this payment record");
      error.statusCode = 403;
      throw error;
    }
  }

  return payment.toSafeObject();
};

/**
 * List Payments for a specific invoice
 */
export const listPaymentsForInvoice = async (invoiceId, authenticatedUser) => {
  const invoice = await Invoice.findById(invoiceId).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  // Check customer ownership
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

  const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: -1 });
  return payments.map((p) => p.toSafeObject());
};
