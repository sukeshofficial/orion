import Subscription, {
  SUBSCRIPTION_STATUS,
} from "../models/subscription.model.js";
import Quotation, {
  QUOTATION_STATUS,
  PAYMENT_TERMS,
} from "../models/quotation.model.js";
import Customer from "../models/customer.model.js";
import Plan from "../models/plan.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import {
  calculateNextBillingDate,
  calculatePlanExpiryDate,
  BILLING_INTERVALS,
} from "../utils/billingDate.utils.js";
import { calculateQuotationPricing } from "./quotation.service.js";
import { recordDiscountUsage } from "./discount.service.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";
import { generateCustomerNumber } from "./customer.service.js";

/**
 * Subscription Service
 * Centralizes lifecycle state transitions, quotation conversion,
 * billing calculations, and ownership enforcement.
 */

export const generateSubscriptionNumber = async () => {
  let unique = false;
  let subscriptionNumber = "";
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    const count = await Subscription.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `SUB-${(count + attempts).toString().padStart(4, "0")}-${randomSuffix}`;

    const existing = await Subscription.findOne({ subscriptionNumber: candidate });
    if (!existing) {
      subscriptionNumber = candidate;
      unique = true;
    }
  }

  if (!subscriptionNumber) {
    subscriptionNumber = `SUB-${Date.now().toString(36).toUpperCase()}`;
  }

  return subscriptionNumber;
};

/**
 * Convert a confirmed quotation into a subscription.
 *
 * Requirements:
 * - Only confirmed quotations can be converted.
 * - Expired quotations cannot be converted.
 * - Prevent duplicate conversions.
 * - Copy approved pricing snapshots.
 * - Generate a unique subscription number.
 * - Maintain quotation-to-subscription references.
 */
export const convertQuotationToSubscription = async (
  quotationId,
  authenticatedUser
) => {
  const quotation = await Quotation.findById(quotationId).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  // Check customer ownership if called by a customer
  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = quotation.customerId?.userId?._id
      ? quotation.customerId.userId._id.toString()
      : quotation.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this quotation");
      error.statusCode = 403;
      throw error;
    }
  }

  // Prevent duplicate conversions
  if (quotation.convertedToSubscriptionId) {
    const error = new Error("This quotation has already been converted to a subscription");
    error.statusCode = 400;
    throw error;
  }

  // Check if expired
  if (
    quotation.status === QUOTATION_STATUS.EXPIRED ||
    (quotation.expiryDate && new Date(quotation.expiryDate) < new Date())
  ) {
    quotation.status = QUOTATION_STATUS.EXPIRED;
    await quotation.save();
    const error = new Error("Expired quotations cannot be converted");
    error.statusCode = 400;
    throw error;
  }

  // Only Confirmed quotations can be converted
  if (quotation.status !== QUOTATION_STATUS.CONFIRMED) {
    const error = new Error(
      `Only confirmed quotations can be converted. Current status is "${quotation.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  // Calculate subscription dates
  const plan = await Plan.findById(quotation.planId);
  const billingInterval = plan?.billingInterval || quotation.planSnapshot?.billingInterval || BILLING_INTERVALS.MONTHLY;

  const startDate = new Date();
  const nextBillingDate = calculateNextBillingDate(startDate, billingInterval);
  const expiryDate = calculatePlanExpiryDate(startDate, billingInterval, 12); // standard 1-year default cycle

  const subscriptionNumber = await generateSubscriptionNumber();

  // Create Subscription copying pricing snapshots and lines exactly
  const subscription = new Subscription({
    subscriptionNumber,
    customerId: quotation.customerId._id,
    planId: quotation.planId,
    quotationId: quotation._id,
    planSnapshot: quotation.planSnapshot,
    startDate,
    expiryDate,
    billingInterval,
    nextBillingDate,
    paymentTerms: quotation.paymentTerms,
    lines: quotation.lines.map((l) => ({
      productId: l.productId,
      productName: l.productName,
      variantId: l.variantId,
      variantName: l.variantName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      basePrice: l.basePrice,
      variantAdjustment: l.variantAdjustment,
      taxableAmount: l.taxableAmount,
      effectiveTaxRate: l.effectiveTaxRate,
      taxAmount: l.taxAmount,
      taxBreakdown: l.taxBreakdown,
      lineTotal: l.lineTotal,
    })),
    subtotal: quotation.subtotal,
    taxTotal: quotation.taxTotal,
    discountId: quotation.discountId,
    discountSnapshot: quotation.discountSnapshot,
    discountTotal: quotation.discountTotal,
    grandTotal: quotation.grandTotal,
    status: SUBSCRIPTION_STATUS.CONFIRMED,
    createdBy: authenticatedUser._id || authenticatedUser.id,
    statusHistory: [
      {
        status: SUBSCRIPTION_STATUS.CONFIRMED,
        changedBy: authenticatedUser._id || authenticatedUser.id,
        changedAt: new Date(),
        reason: `Converted from quotation ${quotation.quotationNumber}`,
      },
    ],
  });

  await subscription.save();

  // Record discount usage if a discount was applied
  if (quotation.discountId) {
    try {
      await recordDiscountUsage(quotation.discountId);
    } catch (err) {
      // Log error but proceed since quotation was approved
      console.warn("Could not increment discount usage count:", err.message);
    }
  }

  // Update Quotation reference
  quotation.convertedToSubscriptionId = subscription._id;
  await quotation.save();

  await subscription.populate([
    { path: "customerId", populate: { path: "userId", select: "name email phone" } },
    { path: "planId", select: "name price billingInterval" },
    { path: "quotationId", select: "quotationNumber status" },
  ]);

  return subscription.toSafeObject();
};

/**
 * Direct Subscription Creation (Admin/Staff)
 */
export const createSubscription = async ({
  customerId,
  planId,
  lines = [],
  startDate = new Date(),
  expiryDate: expiryDateOverride = null,
  billingInterval: rawBillingInterval,
  paymentTerms: rawPaymentTerms = PAYMENT_TERMS.IMMEDIATE,
  autoRenew,
  allowPause: allowPauseOverride,
  allowEarlyClosure: allowEarlyClosureOverride,
  discountId = null,
  status = SUBSCRIPTION_STATUS.CONFIRMED,
  createdBy,
}) => {
  // Normalize paymentTerms: accept "Net 30" → "net_30", "Immediate" → "immediate", etc.
  const paymentTermsNormalized = (() => {
    const raw = String(rawPaymentTerms || "").trim();
    const directMatch = Object.values(PAYMENT_TERMS).find((v) => v === raw);
    if (directMatch) return directMatch;
    // Map human-readable labels to enum values
    const labelMap = {
      "immediate": PAYMENT_TERMS.IMMEDIATE,
      "due on receipt": PAYMENT_TERMS.IMMEDIATE,
      "net 15": PAYMENT_TERMS.NET_15,
      "net 30": PAYMENT_TERMS.NET_30,
      "net 60": PAYMENT_TERMS.NET_60,
      "net15": PAYMENT_TERMS.NET_15,
      "net30": PAYMENT_TERMS.NET_30,
      "net60": PAYMENT_TERMS.NET_60,
    };
    return labelMap[raw.toLowerCase()] || PAYMENT_TERMS.IMMEDIATE;
  })();
  const paymentTerms = paymentTermsNormalized;
  if (!customerId) {
    const error = new Error("customerId is required");
    error.statusCode = 400;
    throw error;
  }

  let customer = await Customer.findById(customerId);
  if (!customer) {
    customer = await Customer.findOne({ userId: customerId });
  }
  if (!customer) {
    // Try looking up by userId (in case customerId is actually a userId)
    const user = await User.findById(customerId);
    if (user) {
      const custNum = await generateCustomerNumber();
      customer = await Customer.create({
        userId: user._id,
        customerNumber: custNum,
        companyName: user.name || "Customer",
        phone: user.phone || "",
        billingAddress: {},
        taxIdentificationNumber: "",
        isActive: true,
      });
    }
  }

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  if (customer.isActive === false) {
    const error = new Error("Customer is inactive");
    error.statusCode = 400;
    throw error;
  }

  if (!planId) {
    const error = new Error("planId is required");
    error.statusCode = 400;
    throw error;
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    const error = new Error("Subscription plan not found");
    error.statusCode = 404;
    throw error;
  }

  if (plan.isActive === false) {
    const error = new Error("Subscription plan is not active");
    error.statusCode = 400;
    throw error;
  }

  // Calculate pricing
  const pricing = await calculateQuotationPricing({
    plan,
    lines,
    discountId,
  });

  const start = new Date(startDate);
  const normalizedInterval = rawBillingInterval ? String(rawBillingInterval).toLowerCase() : null;
  const billingInterval =
    normalizedInterval && Object.values(BILLING_INTERVALS).includes(normalizedInterval)
      ? normalizedInterval
      : (plan.billingInterval || BILLING_INTERVALS.MONTHLY);
  const nextBillingDate = calculateNextBillingDate(start, billingInterval);
  const expiryDate = expiryDateOverride
    ? new Date(expiryDateOverride)
    : calculatePlanExpiryDate(start, billingInterval, 12);

  const subscriptionNumber = await generateSubscriptionNumber();

  const initialStatus = Object.values(SUBSCRIPTION_STATUS).includes(status)
    ? status
    : SUBSCRIPTION_STATUS.CONFIRMED;

  const subscription = new Subscription({
    subscriptionNumber,
    customerId: customer._id,
    planId: plan._id,
    planSnapshot: {
      id: plan._id ? plan._id.toString() : plan.id,
      name: plan.name,
      price: plan.price,
      billingInterval,
      allowPause: allowPauseOverride !== undefined ? allowPauseOverride : plan.allowPause,
      allowRenewal: autoRenew !== undefined ? autoRenew : plan.allowRenewal,
      allowEarlyClosure: allowEarlyClosureOverride !== undefined ? allowEarlyClosureOverride : plan.allowEarlyClosure,
    },
    startDate: start,
    expiryDate,
    billingInterval,
    nextBillingDate,
    paymentTerms,
    lines: pricing.lines,
    subtotal: pricing.subtotal,
    taxTotal: pricing.taxTotal,
    discountId: discountId || null,
    discountSnapshot: pricing.discountSnapshot,
    discountTotal: pricing.discountTotal,
    grandTotal: pricing.grandTotal,
    status: initialStatus,
    createdBy,
    statusHistory: [
      {
        status: initialStatus,
        changedBy: createdBy,
        changedAt: new Date(),
        reason: "Direct subscription creation",
      },
    ],
  });

  await subscription.save();

  if (discountId) {
    try {
      await recordDiscountUsage(discountId);
    } catch (err) {
      console.warn("Could not increment discount usage count:", err.message);
    }
  }

  await subscription.populate([
    { path: "customerId", populate: { path: "userId", select: "name email phone" } },
    { path: "planId", select: "name price billingInterval" },
  ]);

  return subscription.toSafeObject();
};

/**
 * List subscriptions with role and ownership enforcement
 */
export const listSubscriptions = async (
  authenticatedUser,
  {
    page = 1,
    limit = 20,
    search = "",
    status,
    customerId,
    planId,
  } = {}
) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    // Regular customer: must find the customer profile for this user
    const customer = await Customer.findOne({
      userId: authenticatedUser._id || authenticatedUser.id,
    });
    if (!customer) {
      return {
        subscriptions: [],
        pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 1 },
      };
    }
    query.customerId = customer._id;
  } else if (customerId) {
    query.customerId = customerId;
  }

  if (planId) {
    query.planId = planId;
  }

  if (status && Object.values(SUBSCRIPTION_STATUS).includes(status)) {
    query.status = status;
  }

  if (search && search.trim()) {
    query.$or = [{ subscriptionNumber: { $regex: search.trim(), $options: "i" } }];
  }

  const [subscriptions, total] = await Promise.all([
    Subscription.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "customerId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("planId", "name price billingInterval")
      .populate("quotationId", "quotationNumber"),
    Subscription.countDocuments(query),
  ]);

  return {
    subscriptions: subscriptions.map((s) => s.toSafeObject()),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get subscription by ID with strict ownership check
 */
export const getSubscriptionById = async (id, authenticatedUser) => {
  const subscription = await Subscription.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email phone" },
    })
    .populate("planId", "name price billingInterval allowPause allowRenewal allowEarlyClosure")
    .populate("quotationId", "quotationNumber status");

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  // Customer ownership check: customers must never access another customer's subscription
  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = subscription.customerId?.userId?._id
      ? subscription.customerId.userId._id.toString()
      : subscription.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this subscription");
      error.statusCode = 403;
      throw error;
    }
  }

  return subscription.toSafeObject();
};

/**
 * Update subscription (PATCH)
 * Do NOT allow arbitrary status changes through PATCH requests.
 */
export const updateSubscription = async (id, updates = {}, authenticatedUser) => {
  const subscription = await Subscription.findById(id).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const error = new Error("Customers are not permitted to update subscription settings via PATCH");
    error.statusCode = 403;
    throw error;
  }

  // Disallow arbitrary status modification through PATCH
  if (updates.status !== undefined && updates.status !== subscription.status) {
    const error = new Error(
      "Direct status modification via PATCH is forbidden. Use dedicated lifecycle endpoints (/activate, /pause, /resume, /close, /renew)"
    );
    error.statusCode = 400;
    throw error;
  }

  if (updates.paymentTerms && Object.values(PAYMENT_TERMS).includes(updates.paymentTerms)) {
    subscription.paymentTerms = updates.paymentTerms;
  }

  if (updates.nextBillingDate) {
    subscription.nextBillingDate = new Date(updates.nextBillingDate);
  }

  if (updates.expiryDate) {
    subscription.expiryDate = new Date(updates.expiryDate);
  }

  await subscription.save();
  return subscription.toSafeObject();
};

// ── Centralized Lifecycle Transitions ────────────────────────────────────────

/**
 * Confirm Subscription: Draft / Quotation → Confirmed
 */
export const confirmSubscription = async (id, authenticatedUser, reason = "Subscription confirmed") => {
  const subscription = await Subscription.findById(id).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    subscription.status !== SUBSCRIPTION_STATUS.DRAFT &&
    subscription.status !== SUBSCRIPTION_STATUS.QUOTATION
  ) {
    const error = new Error(
      `Cannot confirm subscription currently in status "${subscription.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  subscription.status = SUBSCRIPTION_STATUS.CONFIRMED;
  subscription.statusHistory.push({
    status: SUBSCRIPTION_STATUS.CONFIRMED,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason,
  });

  await subscription.save();
  return subscription.toSafeObject();
};

/**
 * Activate Subscription: Confirmed → Active
 */
export const activateSubscription = async (id, authenticatedUser, reason = "Subscription activated") => {
  const subscription = await Subscription.findById(id).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.CONFIRMED) {
    const error = new Error(
      `Only confirmed subscriptions can be activated. Current status is "${subscription.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
  if (!subscription.nextBillingDate) {
    subscription.nextBillingDate = calculateNextBillingDate(
      subscription.startDate || new Date(),
      subscription.billingInterval
    );
  }

  subscription.statusHistory.push({
    status: SUBSCRIPTION_STATUS.ACTIVE,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason,
  });

  await subscription.save();
  return subscription.toSafeObject();
};

/**
 * Pause Subscription: Active → Paused
 * Permitted for Admin/Staff or Customer if plan rules permit (allowPause)
 */
export const pauseSubscription = async (id, authenticatedUser, reason = "Subscription paused") => {
  const subscription = await Subscription.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("planId");

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = subscription.customerId?.userId?._id
      ? subscription.customerId.userId._id.toString()
      : subscription.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this subscription");
      error.statusCode = 403;
      throw error;
    }

    // Check plan allowPause rule
    const plan = subscription.planId;
    if (plan && plan.allowPause === false) {
      const error = new Error("Pausing is not permitted under this subscription plan");
      error.statusCode = 400;
      throw error;
    }
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    const error = new Error(
      `Only active subscriptions can be paused. Current status is "${subscription.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  subscription.status = SUBSCRIPTION_STATUS.PAUSED;
  subscription.pausedAt = new Date();
  subscription.statusHistory.push({
    status: SUBSCRIPTION_STATUS.PAUSED,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason,
  });

  await subscription.save();
  return subscription.toSafeObject();
};

/**
 * Resume Subscription: Paused → Active
 */
export const resumeSubscription = async (id, authenticatedUser, reason = "Subscription resumed") => {
  const subscription = await Subscription.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("planId");

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = subscription.customerId?.userId?._id
      ? subscription.customerId.userId._id.toString()
      : subscription.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this subscription");
      error.statusCode = 403;
      throw error;
    }
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.PAUSED) {
    const error = new Error(
      `Only paused subscriptions can be resumed. Current status is "${subscription.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
  subscription.pausedAt = null;

  // Re-calculate nextBillingDate from today if it had passed during pause
  if (subscription.nextBillingDate && new Date(subscription.nextBillingDate) < new Date()) {
    subscription.nextBillingDate = calculateNextBillingDate(
      new Date(),
      subscription.billingInterval
    );
  }

  subscription.statusHistory.push({
    status: SUBSCRIPTION_STATUS.ACTIVE,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason,
  });

  await subscription.save();
  return subscription.toSafeObject();
};

/**
 * Renew Subscription
 */
export const renewSubscription = async (id, authenticatedUser, reason = "Subscription renewed") => {
  const subscription = await Subscription.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("planId");

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  const plan = subscription.planId;
  if (plan && plan.allowRenewal === false) {
    const error = new Error("Renewal is not permitted under this plan");
    error.statusCode = 400;
    throw error;
  }

  if (subscription.status === SUBSCRIPTION_STATUS.CLOSED) {
    const error = new Error("Closed subscriptions cannot be renewed");
    error.statusCode = 400;
    throw error;
  }

  // Extend expiry date by 1 year / 12 cycles
  const currentExpiry = subscription.expiryDate ? new Date(subscription.expiryDate) : new Date();
  const newExpiry = calculatePlanExpiryDate(currentExpiry, subscription.billingInterval, 12);
  subscription.expiryDate = newExpiry;

  if (subscription.status === SUBSCRIPTION_STATUS.PAUSED) {
    subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
    subscription.pausedAt = null;
  }

  subscription.statusHistory.push({
    status: subscription.status,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason: `Subscription renewed until ${newExpiry.toISOString()}: ${reason}`,
  });

  await subscription.save();
  return subscription.toSafeObject();
};

/**
 * Close Subscription: Any active/paused/confirmed state → Closed
 * Customer can request closure if plan rules permit (allowEarlyClosure)
 */
export const closeSubscription = async (id, authenticatedUser, reason = "Subscription closed") => {
  const subscription = await Subscription.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("planId");

  if (!subscription) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);
  if (role === USER_ROLES.USER) {
    const customerUserId = subscription.customerId?.userId?._id
      ? subscription.customerId.userId._id.toString()
      : subscription.customerId?.userId?.toString();
    const currentUserId = (authenticatedUser._id || authenticatedUser.id).toString();

    if (customerUserId !== currentUserId) {
      const error = new Error("Access denied: You do not own this subscription");
      error.statusCode = 403;
      throw error;
    }

    const plan = subscription.planId;
    if (plan && plan.allowEarlyClosure === false) {
      const error = new Error("Early closure is not permitted under this subscription plan");
      error.statusCode = 400;
      throw error;
    }
  }

  if (subscription.status === SUBSCRIPTION_STATUS.CLOSED) {
    return subscription.toSafeObject();
  }

  subscription.status = SUBSCRIPTION_STATUS.CLOSED;
  subscription.closedAt = new Date();
  subscription.closureReason = reason;

  subscription.statusHistory.push({
    status: SUBSCRIPTION_STATUS.CLOSED,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason,
  });

  await subscription.save();
  return subscription.toSafeObject();
};
