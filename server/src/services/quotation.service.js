import Quotation, {
  QUOTATION_STATUS,
  PAYMENT_TERMS,
} from "../models/quotation.model.js";
import QuotationTemplate from "../models/quotationTemplate.model.js";
import Customer from "../models/customer.model.js";
import Plan from "../models/plan.model.js";
import Product from "../models/product.model.js";
import Tax from "../models/tax.model.js";
import Discount from "../models/discount.model.js";
import { isPlanAvailable } from "../utils/billingDate.utils.js";
import { applyDiscount } from "./discount.service.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";

/**
 * Quotation Service
 * Handles creation, calculation, snapshots, status management, customer access, and cancellation.
 */

export const generateQuotationNumber = async () => {
  let unique = false;
  let quotationNumber = "";
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    const count = await Quotation.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `QUOT-${(count + attempts).toString().padStart(4, "0")}-${randomSuffix}`;

    const existing = await Quotation.findOne({ quotationNumber: candidate });
    if (!existing) {
      quotationNumber = candidate;
      unique = true;
    }
  }

  if (!quotationNumber) {
    quotationNumber = `QUOT-${Date.now().toString(36).toUpperCase()}`;
  }

  return quotationNumber;
};

/**
 * Calculates pricing, taxes, and discounts for quotation lines.
 */
export const calculateQuotationPricing = async ({
  plan,
  lines = [],
  discountId = null,
}) => {
  const calculatedLines = [];

  for (const line of lines) {
    const qty = Math.max(1, parseInt(line.quantity, 10) || 1);
    const product = await Product.findById(line.productId).populate("taxIds");
    if (!product) {
      const error = new Error(`Product ${line.productId} not found`);
      error.statusCode = 404;
      throw error;
    }

    if (product.isActive === false) {
      const error = new Error(`Product "${product.name}" is not active`);
      error.statusCode = 400;
      throw error;
    }

    const basePrice = Math.round(product.salesPrice || 0);
    let variantAdjustment = 0;
    let selectedVariant = null;

    if (line.variantId && product.variants?.length > 0) {
      selectedVariant = product.variants.find(
        (v) => (v._id ? v._id.toString() : v.id) === line.variantId.toString()
      );
      if (!selectedVariant) {
        const error = new Error(
          `Variant ${line.variantId} not found on product "${product.name}"`
        );
        error.statusCode = 400;
        throw error;
      }
      variantAdjustment = Math.round(selectedVariant.priceAdjustment || 0);
    }

    const unitPrice = Math.max(0, basePrice + variantAdjustment);
    const taxableAmount = unitPrice * qty;

    // Calculate taxes
    let effectiveTaxRate = 0;
    const taxBreakdown = [];

    if (product.taxIds && product.taxIds.length > 0) {
      for (const t of product.taxIds) {
        if (t && t.isActive !== false) {
          const rate = Number(t.rate) || 0;
          effectiveTaxRate += rate;
          const amt = Math.round((taxableAmount * rate) / 100);
          taxBreakdown.push({
            taxId: t._id,
            name: t.name,
            rate,
            amount: amt,
          });
        }
      }
    }

    const taxAmount = Math.round((taxableAmount * effectiveTaxRate) / 100);
    const lineTotal = taxableAmount + taxAmount;

    calculatedLines.push({
      productId: product._id,
      productName: product.name,
      variantId: selectedVariant ? (selectedVariant._id || selectedVariant.id) : null,
      variantName: selectedVariant ? selectedVariant.name : null,
      quantity: qty,
      basePrice,
      variantAdjustment,
      unitPrice,
      taxableAmount,
      effectiveTaxRate,
      taxAmount,
      taxBreakdown,
      lineTotal,
    });
  }

  // Subtotal (including plan base price if any + lines taxable subtotal)
  const linesSubtotal = calculatedLines.reduce((acc, l) => acc + l.taxableAmount, 0);
  const planPrice = Math.round(plan.price || 0);
  const subtotal = linesSubtotal + planPrice;

  // Tax total
  const linesTaxTotal = calculatedLines.reduce((acc, l) => acc + l.taxAmount, 0);
  const taxTotal = linesTaxTotal;

  // Discount calculation
  let discountTotal = 0;
  let discountSnapshot = null;

  if (discountId) {
    const discountRes = await applyDiscount(discountId, {
      subtotal,
      lines: calculatedLines,
      atDate: new Date(),
    });
    discountTotal = discountRes.discountAmount;
    discountSnapshot = discountRes.discountSnapshot;
  }

  // Grand Total = max(0, subtotal - discountTotal) + taxTotal
  const grandTotal = Math.max(0, subtotal - discountTotal) + taxTotal;

  return {
    lines: calculatedLines,
    subtotal,
    taxTotal,
    discountTotal,
    discountSnapshot,
    grandTotal,
  };
};

/**
 * Create quotation
 */
export const createQuotation = async ({
  customerId,
  templateId = null,
  planId,
  lines = [],
  startDate = new Date(),
  expiryDate = null,
  paymentTerms = PAYMENT_TERMS.IMMEDIATE,
  discountId = null,
  createdBy,
}) => {
  // 1. Validate customer
  if (!customerId) {
    const error = new Error("customerId is required");
    error.statusCode = 400;
    throw error;
  }

  const customer = await Customer.findById(customerId).populate("userId");
  if (!customer) {
    const error = new Error("Customer profile not found");
    error.statusCode = 404;
    throw error;
  }

  if (customer.isActive === false) {
    const error = new Error("Customer profile is inactive");
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate template if provided
  let template = null;
  let effectivePlanId = planId;
  let effectiveLines = lines;
  let templateValidityDays = 30;

  if (templateId) {
    template = await QuotationTemplate.findById(templateId);
    if (!template) {
      const error = new Error("Quotation template not found");
      error.statusCode = 404;
      throw error;
    }
    if (template.isActive === false) {
      const error = new Error("Quotation template is inactive and cannot be used");
      error.statusCode = 400;
      throw error;
    }

    effectivePlanId = planId || template.planId;
    templateValidityDays = template.validityDays || 30;

    // If caller didn't provide lines, default from template
    if (!effectiveLines || effectiveLines.length === 0) {
      effectiveLines = template.productLines.map((pl) => ({
        productId: pl.productId,
        variantId: pl.variantId,
        quantity: pl.quantity,
      }));
    }
  }

  // 3. Validate plan
  if (!effectivePlanId) {
    const error = new Error("planId is required");
    error.statusCode = 400;
    throw error;
  }

  const plan = await Plan.findById(effectivePlanId);
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

  if (!isPlanAvailable(plan, startDate)) {
    const error = new Error("Subscription plan is not available for the requested start date");
    error.statusCode = 400;
    throw error;
  }

  // 4. Calculate Expiry Date
  const start = new Date(startDate);
  let expiry = expiryDate ? new Date(expiryDate) : null;
  if (!expiry || isNaN(expiry.getTime())) {
    expiry = new Date(start);
    expiry.setUTCDate(expiry.getUTCDate() + templateValidityDays);
  }

  if (expiry <= start) {
    const error = new Error("expiryDate must be after startDate");
    error.statusCode = 400;
    throw error;
  }

  // 5. Calculate Pricing & Line items
  const pricing = await calculateQuotationPricing({
    plan,
    lines: effectiveLines,
    discountId,
  });

  // 6. Plan snapshot
  const planSnapshot = {
    id: plan._id ? plan._id.toString() : plan.id,
    name: plan.name,
    price: plan.price,
    billingInterval: plan.billingInterval,
    allowPause: plan.allowPause,
    allowRenewal: plan.allowRenewal,
    allowEarlyClosure: plan.allowEarlyClosure,
  };

  // 7. Generate Quotation Number
  const quotationNumber = await generateQuotationNumber();

  // 8. Create Quotation
  const quotation = new Quotation({
    quotationNumber,
    customerId: customer._id,
    templateId: template ? template._id : null,
    planId: plan._id,
    planSnapshot,
    startDate: start,
    expiryDate: expiry,
    paymentTerms: Object.values(PAYMENT_TERMS).includes(paymentTerms)
      ? paymentTerms
      : PAYMENT_TERMS.IMMEDIATE,
    lines: pricing.lines,
    subtotal: pricing.subtotal,
    taxTotal: pricing.taxTotal,
    discountId: discountId || null,
    discountSnapshot: pricing.discountSnapshot,
    discountTotal: pricing.discountTotal,
    grandTotal: pricing.grandTotal,
    status: QUOTATION_STATUS.QUOTATION,
    createdBy,
    statusHistory: [
      {
        status: QUOTATION_STATUS.QUOTATION,
        changedBy: createdBy,
        changedAt: new Date(),
        reason: "Initial quotation creation",
      },
    ],
  });

  await quotation.save();
  await quotation.populate([
    { path: "customerId", populate: { path: "userId", select: "name email phone" } },
    { path: "planId", select: "name price billingInterval" },
  ]);

  return quotation.toSafeObject();
};

/**
 * List quotations with role/ownership enforcement
 */
export const listQuotations = async (
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
        quotations: [],
        pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 1 },
      };
    }
    query.customerId = customer._id;
  } else if (customerId) {
    // Admin / Staff filtering by specific customer
    query.customerId = customerId;
  }

  if (planId) {
    query.planId = planId;
  }

  if (status && Object.values(QUOTATION_STATUS).includes(status)) {
    query.status = status;
  }

  if (search && search.trim()) {
    query.$or = [{ quotationNumber: { $regex: search.trim(), $options: "i" } }];
  }

  const [quotations, total] = await Promise.all([
    Quotation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "customerId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("planId", "name price billingInterval"),
    Quotation.countDocuments(query),
  ]);

  return {
    quotations: quotations.map((q) => q.toSafeObject()),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get quotation by ID with ownership check
 */
export const getQuotationById = async (id, authenticatedUser) => {
  const quotation = await Quotation.findById(id)
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name email phone" },
    })
    .populate("planId", "name price billingInterval")
    .populate("templateId", "name");

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  // Check customer ownership
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

  // Check if expired and dynamically mark it
  if (
    quotation.status === QUOTATION_STATUS.QUOTATION &&
    quotation.expiryDate &&
    new Date(quotation.expiryDate) < new Date()
  ) {
    quotation.status = QUOTATION_STATUS.EXPIRED;
    quotation.statusHistory.push({
      status: QUOTATION_STATUS.EXPIRED,
      changedBy: authenticatedUser._id || authenticatedUser.id,
      changedAt: new Date(),
      reason: "Quotation validity period expired",
    });
    await quotation.save();
  }

  return quotation.toSafeObject();
};

/**
 * Update quotation (Only Draft or Quotation status allowed; customer cannot update pricing or lines)
 */
export const updateQuotation = async (id, updates = {}, authenticatedUser) => {
  const quotation = await Quotation.findById(id).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  const role = normalizeRole(authenticatedUser.role);

  // Customer cannot modify quotation lines, prices or dates
  if (role === USER_ROLES.USER) {
    const error = new Error("Customers are not permitted to modify quotation details");
    error.statusCode = 403;
    throw error;
  }

  // Cannot modify if Confirmed, Cancelled, or Expired
  if (
    quotation.status === QUOTATION_STATUS.CONFIRMED ||
    quotation.status === QUOTATION_STATUS.CANCELLED ||
    quotation.status === QUOTATION_STATUS.EXPIRED
  ) {
    const error = new Error(
      `Cannot update quotation in status "${quotation.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  if (updates.paymentTerms && Object.values(PAYMENT_TERMS).includes(updates.paymentTerms)) {
    quotation.paymentTerms = updates.paymentTerms;
  }

  if (updates.expiryDate) {
    const newExpiry = new Date(updates.expiryDate);
    if (newExpiry <= quotation.startDate) {
      const error = new Error("expiryDate must be after startDate");
      error.statusCode = 400;
      throw error;
    }
    quotation.expiryDate = newExpiry;
  }

  // If planId or lines are updated, recalculate pricing
  const planIdToUse = updates.planId || quotation.planId;
  const linesToUse = updates.lines !== undefined ? updates.lines : quotation.lines;
  const discountIdToUse = updates.discountId !== undefined ? updates.discountId : quotation.discountId;

  if (updates.planId || updates.lines !== undefined || updates.discountId !== undefined) {
    const plan = await Plan.findById(planIdToUse);
    if (!plan) {
      const error = new Error("Subscription plan not found");
      error.statusCode = 404;
      throw error;
    }

    const pricing = await calculateQuotationPricing({
      plan,
      lines: linesToUse,
      discountId: discountIdToUse,
    });

    quotation.planId = plan._id;
    quotation.planSnapshot = {
      id: plan._id ? plan._id.toString() : plan.id,
      name: plan.name,
      price: plan.price,
      billingInterval: plan.billingInterval,
      allowPause: plan.allowPause,
      allowRenewal: plan.allowRenewal,
      allowEarlyClosure: plan.allowEarlyClosure,
    };
    quotation.lines = pricing.lines;
    quotation.subtotal = pricing.subtotal;
    quotation.taxTotal = pricing.taxTotal;
    quotation.discountId = discountIdToUse || null;
    quotation.discountSnapshot = pricing.discountSnapshot;
    quotation.discountTotal = pricing.discountTotal;
    quotation.grandTotal = pricing.grandTotal;
  }

  await quotation.save();
  return quotation.toSafeObject();
};

/**
 * Confirm Quotation (by Customer owner or Admin/Staff)
 */
export const confirmQuotation = async (id, authenticatedUser, reason = "Quotation confirmed") => {
  const quotation = await Quotation.findById(id).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  // Ownership check for customers
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

  // Expired check
  if (
    quotation.status === QUOTATION_STATUS.EXPIRED ||
    (quotation.expiryDate && new Date(quotation.expiryDate) < new Date())
  ) {
    quotation.status = QUOTATION_STATUS.EXPIRED;
    await quotation.save();
    const error = new Error("Cannot confirm an expired quotation");
    error.statusCode = 400;
    throw error;
  }

  // Valid status transitions: only Draft or Quotation can be Confirmed
  if (
    quotation.status !== QUOTATION_STATUS.DRAFT &&
    quotation.status !== QUOTATION_STATUS.QUOTATION
  ) {
    const error = new Error(
      `Cannot confirm quotation in status "${quotation.status}"`
    );
    error.statusCode = 400;
    throw error;
  }

  quotation.status = QUOTATION_STATUS.CONFIRMED;
  quotation.statusHistory.push({
    status: QUOTATION_STATUS.CONFIRMED,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason,
  });

  await quotation.save();
  return quotation.toSafeObject();
};

/**
 * Cancel Quotation (by Customer owner or Admin/Staff)
 */
export const cancelQuotation = async (id, authenticatedUser, reason = "Quotation cancelled") => {
  const quotation = await Quotation.findById(id).populate({
    path: "customerId",
    populate: { path: "userId", select: "name email" },
  });

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  // Ownership check for customers
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

  if (quotation.status === QUOTATION_STATUS.CANCELLED) {
    return quotation.toSafeObject();
  }

  if (quotation.convertedToSubscriptionId) {
    const error = new Error("Cannot cancel a quotation that has already been converted to a subscription");
    error.statusCode = 400;
    throw error;
  }

  quotation.status = QUOTATION_STATUS.CANCELLED;
  quotation.statusHistory.push({
    status: QUOTATION_STATUS.CANCELLED,
    changedBy: authenticatedUser._id || authenticatedUser.id,
    changedAt: new Date(),
    reason,
  });

  await quotation.save();
  return quotation.toSafeObject();
};
