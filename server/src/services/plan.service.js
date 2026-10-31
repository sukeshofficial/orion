import Plan from "../models/plan.model.js";
import Product from "../models/product.model.js";
import { BILLING_INTERVALS, isPlanAvailable } from "../utils/billingDate.utils.js";

/**
 * Plan Service
 * Handles subscription plan lifecycle, validation, and historical pricing preservation.
 */

export const createPlan = async ({
  name,
  description = "",
  products = [],
  price,
  billingInterval = BILLING_INTERVALS.MONTHLY,
  minimumQuantity = 1,
  availableFrom = null,
  availableUntil = null,
  autoCloseAtExpiry = false,
  allowEarlyClosure = true,
  allowPause = true,
  allowRenewal = true,
  isActive = true,
  userId,
}) => {
  if (!name || typeof price === "undefined" || price === null) {
    const error = new Error("Plan name and price are required");
    error.statusCode = 400;
    throw error;
  }

  const numPrice = Math.round(Number(price));
  if (isNaN(numPrice) || numPrice < 0) {
    const error = new Error("Price must be a non-negative number in minor units");
    error.statusCode = 400;
    throw error;
  }

  if (!Object.values(BILLING_INTERVALS).includes(billingInterval)) {
    const error = new Error(`Invalid billingInterval: ${billingInterval}. Must be one of: ${Object.values(BILLING_INTERVALS).join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (typeof minimumQuantity !== "undefined" && minimumQuantity !== null) {
    const parsedMinQty = parseInt(minimumQuantity, 10);
    if (isNaN(parsedMinQty) || parsedMinQty < 1) {
      const error = new Error("minimumQuantity must be at least 1");
      error.statusCode = 400;
      throw error;
    }
  }

  const minQty = parseInt(minimumQuantity, 10) || 1;

  // Validate product references if provided
  if (Array.isArray(products) && products.length > 0) {
    const productIds = products.map((p) => p.productId).filter(Boolean);
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    if (existingProducts.length !== productIds.length) {
      const error = new Error("One or more product references are invalid or do not exist");
      error.statusCode = 400;
      throw error;
    }
  }

  const plan = new Plan({
    name: name.trim(),
    description: description ? description.trim() : "",
    products: products || [],
    price: numPrice,
    billingInterval,
    minimumQuantity: minQty,
    availableFrom: availableFrom ? new Date(availableFrom) : null,
    availableUntil: availableUntil ? new Date(availableUntil) : null,
    autoCloseAtExpiry: Boolean(autoCloseAtExpiry),
    allowEarlyClosure: allowEarlyClosure !== false,
    allowPause: allowPause !== false,
    allowRenewal: allowRenewal !== false,
    isActive: isActive !== false,
    createdBy: userId,
  });

  await plan.save();
  await plan.populate("products.productId");
  return plan.toSafeObject();
};

export const listPlans = async ({
  page = 1,
  limit = 20,
  search,
  billingInterval,
  isActive,
  checkAvailability = false,
} = {}) => {
  const query = {};

  if (typeof isActive !== "undefined" && isActive !== null && isActive !== "") {
    query.isActive = isActive === "true" || isActive === true;
  }

  if (billingInterval) {
    query.billingInterval = billingInterval;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [plans, total] = await Promise.all([
    Plan.find(query)
      .populate("products.productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take),
    Plan.countDocuments(query),
  ]);

  let safePlans = plans.map((p) => p.toSafeObject());

  if (checkAvailability) {
    const now = new Date();
    safePlans = safePlans.filter((p) => isPlanAvailable(p, now));
  }

  return {
    plans: safePlans,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getPlanById = async (id) => {
  const plan = await Plan.findById(id).populate("products.productId");
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }
  return plan.toSafeObject();
};

export const updatePlan = async (id, updates = {}) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }

  if (typeof updates.name === "string" && updates.name.trim()) {
    plan.name = updates.name.trim();
  }

  if (typeof updates.description === "string") {
    plan.description = updates.description.trim();
  }

  if (typeof updates.price !== "undefined" && updates.price !== null) {
    const numPrice = Math.round(Number(updates.price));
    if (isNaN(numPrice) || numPrice < 0) {
      const error = new Error("Price must be a non-negative number in minor units");
      error.statusCode = 400;
      throw error;
    }
    // Note: Updating price affects new subscriptions only; existing subscriptions preserve historical price
    plan.price = numPrice;
  }

  if (updates.billingInterval) {
    if (!Object.values(BILLING_INTERVALS).includes(updates.billingInterval)) {
      const error = new Error(`Invalid billingInterval: ${updates.billingInterval}`);
      error.statusCode = 400;
      throw error;
    }
    plan.billingInterval = updates.billingInterval;
  }

  if (typeof updates.minimumQuantity !== "undefined" && updates.minimumQuantity !== null) {
    const minQty = parseInt(updates.minimumQuantity, 10);
    if (isNaN(minQty) || minQty < 1) {
      const error = new Error("minimumQuantity must be at least 1");
      error.statusCode = 400;
      throw error;
    }
    plan.minimumQuantity = minQty;
  }

  if (Array.isArray(updates.products)) {
    const productIds = updates.products.map((p) => p.productId).filter(Boolean);
    if (productIds.length > 0) {
      const existingProducts = await Product.find({ _id: { $in: productIds } });
      if (existingProducts.length !== productIds.length) {
        const error = new Error("One or more product references are invalid or do not exist");
        error.statusCode = 400;
        throw error;
      }
    }
    plan.products = updates.products;
  }

  if (typeof updates.availableFrom !== "undefined") {
    plan.availableFrom = updates.availableFrom ? new Date(updates.availableFrom) : null;
  }

  if (typeof updates.availableUntil !== "undefined") {
    plan.availableUntil = updates.availableUntil ? new Date(updates.availableUntil) : null;
  }

  if (typeof updates.autoCloseAtExpiry === "boolean") {
    plan.autoCloseAtExpiry = updates.autoCloseAtExpiry;
  }

  if (typeof updates.allowEarlyClosure === "boolean") {
    plan.allowEarlyClosure = updates.allowEarlyClosure;
  }

  if (typeof updates.allowPause === "boolean") {
    plan.allowPause = updates.allowPause;
  }

  if (typeof updates.allowRenewal === "boolean") {
    plan.allowRenewal = updates.allowRenewal;
  }

  if (typeof updates.isActive === "boolean") {
    plan.isActive = updates.isActive;
  }

  await plan.save();
  await plan.populate("products.productId");
  return plan.toSafeObject();
};

export const updatePlanStatus = async (id, isActive) => {
  const plan = await Plan.findById(id);
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }

  let finalActive = true;
  if (typeof isActive === "boolean") {
    finalActive = isActive;
  } else if (typeof isActive === "string") {
    finalActive = isActive === "active" || isActive === "true";
  }

  plan.isActive = finalActive;
  await plan.save();
  await plan.populate("products.productId");
  return plan.toSafeObject();
};
