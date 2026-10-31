import QuotationTemplate from "../models/quotationTemplate.model.js";
import Plan from "../models/plan.model.js";
import Product from "../models/product.model.js";

/**
 * Quotation Template Service
 * Handles template creation, listing, retrieval, updates and validation.
 */

export const validateTemplateData = async ({ planId, productLines = [], validityDays }) => {
  // 1. Validate plan reference
  if (!planId) {
    const error = new Error("planId is required");
    error.statusCode = 400;
    throw error;
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    const error = new Error("Referenced subscription plan not found");
    error.statusCode = 404;
    throw error;
  }

  if (plan.isActive === false) {
    const error = new Error("Referenced subscription plan is not active");
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate validityDays
  if (validityDays !== undefined) {
    const days = parseInt(validityDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      const error = new Error("validityDays must be an integer between 1 and 365");
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Validate productLines if provided
  const validatedLines = [];
  if (Array.isArray(productLines) && productLines.length > 0) {
    for (const line of productLines) {
      if (!line.productId) {
        const error = new Error("Each product line must contain a productId");
        error.statusCode = 400;
        throw error;
      }

      const product = await Product.findById(line.productId);
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

      const qty = parseInt(line.quantity, 10);
      if (isNaN(qty) || qty < 1) {
        const error = new Error(`Quantity for product "${product.name}" must be at least 1`);
        error.statusCode = 400;
        throw error;
      }

      let variantId = null;
      if (line.variantId) {
        const variant = product.variants?.find(
          (v) => (v._id ? v._id.toString() : v.id) === line.variantId.toString()
        );
        if (!variant) {
          const error = new Error(`Variant ${line.variantId} not found on product "${product.name}"`);
          error.statusCode = 400;
          throw error;
        }
        variantId = variant._id || variant.id;
      }

      validatedLines.push({
        productId: product._id,
        variantId,
        quantity: qty,
      });
    }
  }

  return { plan, validatedLines };
};

export const createQuotationTemplate = async ({
  name,
  planId,
  productLines = [],
  validityDays = 30,
  isActive = true,
  createdBy,
}) => {
  if (!name || !name.trim()) {
    const error = new Error("Template name is required");
    error.statusCode = 400;
    throw error;
  }

  const { validatedLines } = await validateTemplateData({
    planId,
    productLines,
    validityDays,
  });

  const template = new QuotationTemplate({
    name: name.trim(),
    planId,
    productLines: validatedLines,
    validityDays: parseInt(validityDays, 10) || 30,
    isActive: isActive !== false,
    createdBy,
  });

  await template.save();
  await template.populate([
    { path: "planId", select: "name price billingInterval isActive" },
    { path: "productLines.productId", select: "name salesPrice isActive variants" },
  ]);

  return template.toSafeObject();
};

export const listQuotationTemplates = async ({
  page = 1,
  limit = 20,
  search = "",
  isActive,
  planId,
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

  if (planId) {
    query.planId = planId;
  }

  if (search && search.trim()) {
    query.$or = [{ name: { $regex: search.trim(), $options: "i" } }];
  }

  const [templates, total] = await Promise.all([
    QuotationTemplate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("planId", "name price billingInterval isActive")
      .populate("productLines.productId", "name salesPrice isActive"),
    QuotationTemplate.countDocuments(query),
  ]);

  return {
    templates: templates.map((t) => t.toSafeObject()),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getQuotationTemplateById = async (id) => {
  const template = await QuotationTemplate.findById(id)
    .populate("planId", "name price billingInterval isActive")
    .populate("productLines.productId", "name salesPrice isActive variants");

  if (!template) {
    const error = new Error("Quotation template not found");
    error.statusCode = 404;
    throw error;
  }

  return template.toSafeObject();
};

export const updateQuotationTemplate = async (id, updates = {}) => {
  const template = await QuotationTemplate.findById(id);
  if (!template) {
    const error = new Error("Quotation template not found");
    error.statusCode = 404;
    throw error;
  }

  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      const error = new Error("Template name cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    template.name = updates.name.trim();
  }

  const planIdToValidate = updates.planId || template.planId;
  const linesToValidate = updates.productLines !== undefined ? updates.productLines : template.productLines;
  const validityToValidate = updates.validityDays !== undefined ? updates.validityDays : template.validityDays;

  const { validatedLines } = await validateTemplateData({
    planId: planIdToValidate,
    productLines: linesToValidate,
    validityDays: validityToValidate,
  });

  if (updates.planId !== undefined) {
    template.planId = updates.planId;
  }

  if (updates.productLines !== undefined) {
    template.productLines = validatedLines;
  }

  if (updates.validityDays !== undefined) {
    template.validityDays = parseInt(updates.validityDays, 10);
  }

  if (typeof updates.isActive === "boolean") {
    template.isActive = updates.isActive;
  }

  await template.save();
  await template.populate([
    { path: "planId", select: "name price billingInterval isActive" },
    { path: "productLines.productId", select: "name salesPrice isActive" },
  ]);

  return template.toSafeObject();
};
