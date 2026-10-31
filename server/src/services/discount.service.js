import Discount, {
  DISCOUNT_TYPES,
  DISCOUNT_APPLIES_TO,
} from "../models/discount.model.js";

/**
 * Discount Service
 * Handles CRUD, validation, limit enforcement, and discount calculation.
 */

/**
 * Validate discount eligibility for an order / quotation / subscription.
 *
 * @param {object} discount - Discount model or populated discount object
 * @param {object} context
 * @param {number} context.subtotal - Subtotal amount in minor units
 * @param {Array<{ productId: string, quantity: number, taxableAmount: number }>} context.lines - Line items
 * @param {Date} [context.atDate=new Date()] - Reference date
 * @returns {{ eligible: boolean, reason?: string }}
 */
export const validateDiscountEligibility = (discount, context = {}) => {
  if (!discount) {
    return { eligible: false, reason: "Discount not found" };
  }

  if (discount.isActive === false) {
    return { eligible: false, reason: "Discount is not active" };
  }

  const atDate = context.atDate ? new Date(context.atDate) : new Date();

  // Validate start date
  if (discount.startDate && new Date(discount.startDate) > atDate) {
    return { eligible: false, reason: "Discount is not yet active" };
  }

  // Validate end date
  if (discount.endDate && new Date(discount.endDate) < atDate) {
    return { eligible: false, reason: "Discount has expired" };
  }

  // Validate usage limit
  if (
    typeof discount.usageLimit === "number" &&
    discount.usageLimit > 0 &&
    discount.usageCount >= discount.usageLimit
  ) {
    return { eligible: false, reason: "Discount usage limit reached" };
  }

  const subtotal = Math.max(0, parseInt(context.subtotal, 10) || 0);
  const lines = Array.isArray(context.lines) ? context.lines : [];

  // Total quantity across lines
  const totalQuantity = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);

  // Validate minimum quantity if specified
  if (discount.minimumQuantity && totalQuantity < discount.minimumQuantity) {
    return {
      eligible: false,
      reason: `Minimum required quantity is ${discount.minimumQuantity} (provided ${totalQuantity})`,
    };
  }

  // Validate minimum purchase if specified
  if (discount.minimumPurchase && subtotal < discount.minimumPurchase) {
    return {
      eligible: false,
      reason: `Minimum purchase requirement of ${discount.minimumPurchase} not met (current subtotal is ${subtotal})`,
    };
  }

  // If discount applies only to specific products, ensure at least one applicable product is in lines
  if (
    discount.appliesTo === DISCOUNT_APPLIES_TO.PRODUCTS &&
    Array.isArray(discount.applicableProducts) &&
    discount.applicableProducts.length > 0
  ) {
    const applicableIds = new Set(
      discount.applicableProducts.map((p) => (p._id ? p._id.toString() : p.toString()))
    );

    const hasMatchingProduct = lines.some((l) => {
      const pid = l.productId?._id ? l.productId._id.toString() : l.productId?.toString();
      return applicableIds.has(pid);
    });

    if (!hasMatchingProduct) {
      return {
        eligible: false,
        reason: "Discount applies to specific products none of which are in this order",
      };
    }
  }

  return { eligible: true };
};

/**
 * Calculate fixed discount amount.
 * Cannot exceed the eligible subtotal.
 */
export const calculateFixedDiscount = (fixedValue, eligibleAmount) => {
  const value = Math.max(0, parseInt(fixedValue, 10) || 0);
  const amount = Math.max(0, parseInt(eligibleAmount, 10) || 0);
  return Math.min(value, amount);
};

/**
 * Calculate percentage discount amount.
 * percentageRate: e.g. 10 for 10%
 * Result is rounded to integer minor units.
 */
export const calculatePercentageDiscount = (percentageRate, eligibleAmount) => {
  const rate = Math.max(0, Number(percentageRate) || 0);
  const amount = Math.max(0, parseInt(eligibleAmount, 10) || 0);
  const discount = Math.round((amount * rate) / 100);
  return Math.min(discount, amount);
};

/**
 * Apply discount to an order context and calculate discount amount.
 *
 * @param {object|string} discountIdOrDoc - Discount document or ID
 * @param {object} context - { subtotal, lines, atDate }
 * @returns {Promise<{ discountAmount: number, discountSnapshot: object, discount: object }>}
 */
export const applyDiscount = async (discountIdOrDoc, context = {}) => {
  if (!discountIdOrDoc) {
    return { discountAmount: 0, discountSnapshot: null, discount: null };
  }

  let discount = discountIdOrDoc;
  if (typeof discountIdOrDoc === "string" || discountIdOrDoc instanceof String) {
    discount = await Discount.findById(discountIdOrDoc);
  }

  if (!discount) {
    const error = new Error("Discount not found");
    error.statusCode = 404;
    throw error;
  }

  const validation = validateDiscountEligibility(discount, context);
  if (!validation.eligible) {
    const error = new Error(`Discount ineligible: ${validation.reason}`);
    error.statusCode = 400;
    throw error;
  }

  const subtotal = Math.max(0, parseInt(context.subtotal, 10) || 0);
  const lines = Array.isArray(context.lines) ? context.lines : [];

  let eligibleAmount = subtotal;

  // If appliesTo is products, sum only the taxable amounts of eligible products
  if (
    discount.appliesTo === DISCOUNT_APPLIES_TO.PRODUCTS &&
    Array.isArray(discount.applicableProducts) &&
    discount.applicableProducts.length > 0
  ) {
    const applicableIds = new Set(
      discount.applicableProducts.map((p) => (p._id ? p._id.toString() : p.toString()))
    );

    eligibleAmount = lines.reduce((acc, l) => {
      const pid = l.productId?._id ? l.productId._id.toString() : l.productId?.toString();
      if (applicableIds.has(pid)) {
        return acc + (Number(l.taxableAmount) || 0);
      }
      return acc;
    }, 0);
  }

  let discountAmount = 0;
  if (discount.type === DISCOUNT_TYPES.FIXED) {
    discountAmount = calculateFixedDiscount(discount.value, eligibleAmount);
  } else if (discount.type === DISCOUNT_TYPES.PERCENTAGE) {
    discountAmount = calculatePercentageDiscount(discount.value, eligibleAmount);
  }

  return {
    discountAmount,
    discountSnapshot: {
      id: discount._id ? discount._id.toString() : discount.id,
      name: discount.name,
      code: discount.code || "",
      type: discount.type,
      value: discount.value,
      appliedAmount: discountAmount,
    },
    discount,
  };
};

/**
 * Increment discount usage count atomically (concurrency safe).
 */
export const recordDiscountUsage = async (discountId) => {
  if (!discountId) return null;

  const result = await Discount.findOneAndUpdate(
    {
      _id: discountId,
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
      ],
    },
    { $inc: { usageCount: 1 } },
    { new: true }
  );

  if (!result) {
    const error = new Error("Discount usage limit reached or discount unavailable");
    error.statusCode = 400;
    throw error;
  }

  return result;
};

// ── CRUD Methods ─────────────────────────────────────────────────────────────

export const createDiscount = async ({
  name,
  code,
  type,
  value,
  minimumPurchase,
  minimumQuantity,
  appliesTo,
  applicableProducts,
  startDate,
  endDate,
  usageLimit,
  isActive = true,
  createdBy,
}) => {
  if (!name || !name.trim()) {
    const error = new Error("Discount name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!type || !Object.values(DISCOUNT_TYPES).includes(type)) {
    const error = new Error("Valid discount type (fixed or percentage) is required");
    error.statusCode = 400;
    throw error;
  }

  const numValue = Number(value);
  if (isNaN(numValue) || numValue < 0) {
    const error = new Error("Discount value must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }

  if (type === DISCOUNT_TYPES.PERCENTAGE && numValue > 100) {
    const error = new Error("Percentage discount value cannot exceed 100%");
    error.statusCode = 400;
    throw error;
  }

  // Validate date range if both provided
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    const error = new Error("startDate cannot be after endDate");
    error.statusCode = 400;
    throw error;
  }

  const discount = new Discount({
    name: name.trim(),
    code: code ? code.trim().toUpperCase() : undefined,
    type,
    value: numValue,
    minimumPurchase: minimumPurchase !== undefined ? Math.max(0, parseInt(minimumPurchase, 10)) : 0,
    minimumQuantity: minimumQuantity !== undefined ? Math.max(1, parseInt(minimumQuantity, 10)) : 1,
    appliesTo: appliesTo || DISCOUNT_APPLIES_TO.SUBSCRIPTION,
    applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    usageLimit: usageLimit !== undefined && usageLimit !== null ? Math.max(1, parseInt(usageLimit, 10)) : null,
    isActive: isActive !== false,
    createdBy,
  });

  await discount.save();
  return discount.toSafeObject();
};

export const listDiscounts = async ({
  page = 1,
  limit = 20,
  search = "",
  isActive,
  type,
  appliesTo,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  } else if (isActive === "true" || isActive === "false") {
    query.isActive = isActive === "true";
  }

  if (type && Object.values(DISCOUNT_TYPES).includes(type)) {
    query.type = type;
  }

  if (appliesTo && Object.values(DISCOUNT_APPLIES_TO).includes(appliesTo)) {
    query.appliesTo = appliesTo;
  }

  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { code: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [discounts, total] = await Promise.all([
    Discount.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("applicableProducts", "name salesPrice"),
    Discount.countDocuments(query),
  ]);

  return {
    discounts: discounts.map((d) => d.toSafeObject()),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getDiscountById = async (id) => {
  const discount = await Discount.findById(id).populate(
    "applicableProducts",
    "name salesPrice"
  );
  if (!discount) {
    const error = new Error("Discount not found");
    error.statusCode = 404;
    throw error;
  }
  return discount.toSafeObject();
};

export const updateDiscount = async (id, updates = {}) => {
  const discount = await Discount.findById(id);
  if (!discount) {
    const error = new Error("Discount not found");
    error.statusCode = 404;
    throw error;
  }

  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      const error = new Error("Discount name cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    discount.name = updates.name.trim();
  }

  if (updates.code !== undefined) {
    discount.code = updates.code ? updates.code.trim().toUpperCase() : undefined;
  }

  if (updates.type !== undefined) {
    if (!Object.values(DISCOUNT_TYPES).includes(updates.type)) {
      const error = new Error("Invalid discount type");
      error.statusCode = 400;
      throw error;
    }
    discount.type = updates.type;
  }

  if (updates.value !== undefined) {
    const numValue = Number(updates.value);
    if (isNaN(numValue) || numValue < 0) {
      const error = new Error("Discount value must be a non-negative number");
      error.statusCode = 400;
      throw error;
    }
    if (discount.type === DISCOUNT_TYPES.PERCENTAGE && numValue > 100) {
      const error = new Error("Percentage discount value cannot exceed 100%");
      error.statusCode = 400;
      throw error;
    }
    discount.value = numValue;
  }

  if (updates.minimumPurchase !== undefined) {
    discount.minimumPurchase = Math.max(0, parseInt(updates.minimumPurchase, 10));
  }

  if (updates.minimumQuantity !== undefined) {
    discount.minimumQuantity = Math.max(1, parseInt(updates.minimumQuantity, 10));
  }

  if (updates.appliesTo !== undefined) {
    if (!Object.values(DISCOUNT_APPLIES_TO).includes(updates.appliesTo)) {
      const error = new Error("Invalid appliesTo option");
      error.statusCode = 400;
      throw error;
    }
    discount.appliesTo = updates.appliesTo;
  }

  if (Array.isArray(updates.applicableProducts)) {
    discount.applicableProducts = updates.applicableProducts;
  }

  if (updates.startDate !== undefined) {
    discount.startDate = updates.startDate ? new Date(updates.startDate) : null;
  }

  if (updates.endDate !== undefined) {
    discount.endDate = updates.endDate ? new Date(updates.endDate) : null;
  }

  if (discount.startDate && discount.endDate && discount.startDate > discount.endDate) {
    const error = new Error("startDate cannot be after endDate");
    error.statusCode = 400;
    throw error;
  }

  if (updates.usageLimit !== undefined) {
    discount.usageLimit =
      updates.usageLimit !== null && updates.usageLimit !== undefined
        ? Math.max(1, parseInt(updates.usageLimit, 10))
        : null;
  }

  if (typeof updates.isActive === "boolean") {
    discount.isActive = updates.isActive;
  }

  await discount.save();
  return discount.toSafeObject();
};

export const updateDiscountStatus = async (id, isActive) => {
  const discount = await Discount.findById(id);
  if (!discount) {
    const error = new Error("Discount not found");
    error.statusCode = 404;
    throw error;
  }

  discount.isActive = Boolean(isActive);
  await discount.save();
  return discount.toSafeObject();
};
