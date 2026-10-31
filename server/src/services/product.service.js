import Product, { PRODUCT_TYPES } from "../models/product.model.js";
import Tax from "../models/tax.model.js";

/**
 * Product Service
 * Catalog administration, variant management, tax associations.
 */

export const createProduct = async ({
  name,
  type = PRODUCT_TYPES.SERVICE,
  salesPrice,
  costPrice = 0,
  notes = "",
  taxIds = [],
  variants = [],
  isActive = true,
  userId,
}) => {
  if (!name || typeof salesPrice === "undefined" || salesPrice === null) {
    const error = new Error("Product name and salesPrice are required");
    error.statusCode = 400;
    throw error;
  }

  const numSalesPrice = Math.round(Number(salesPrice));
  if (isNaN(numSalesPrice) || numSalesPrice < 0) {
    const error = new Error("salesPrice must be a non-negative number in minor units");
    error.statusCode = 400;
    throw error;
  }

  const numCostPrice = Math.round(Number(costPrice) || 0);

  // Validate tax IDs if provided
  if (Array.isArray(taxIds) && taxIds.length > 0) {
    const foundTaxes = await Tax.countDocuments({ _id: { $in: taxIds } });
    if (foundTaxes !== taxIds.length) {
      const error = new Error("One or more taxIds are invalid or do not exist");
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate variants
  const formattedVariants = (Array.isArray(variants) ? variants : []).map((v) => ({
    name: String(v.name || "").trim(),
    sku: String(v.sku || "").trim(),
    priceAdjustment: Math.round(Number(v.priceAdjustment) || 0),
    attributes: v.attributes || {},
    isActive: v.isActive !== false,
  }));

  const product = new Product({
    name: name.trim(),
    type,
    salesPrice: numSalesPrice,
    costPrice: numCostPrice,
    notes: notes ? notes.trim() : "",
    taxIds: taxIds || [],
    variants: formattedVariants,
    isActive: isActive !== false,
    createdBy: userId,
  });

  await product.save();
  await product.populate("taxIds");
  return product.toSafeObject();
};

export const listProducts = async ({
  page = 1,
  limit = 20,
  search,
  type,
  isActive,
} = {}) => {
  const query = {};

  if (typeof isActive !== "undefined" && isActive !== null && isActive !== "") {
    query.isActive = isActive === "true" || isActive === true;
  }

  if (type) {
    query.type = type;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [{ name: searchRegex }, { notes: searchRegex }];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("taxIds")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take),
    Product.countDocuments(query),
  ]);

  return {
    products: products.map((p) => p.toSafeObject()),
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id).populate("taxIds");
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }
  return product.toSafeObject();
};

export const updateProduct = async (id, updates = {}) => {
  const product = await Product.findById(id);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (typeof updates.name === "string" && updates.name.trim()) {
    product.name = updates.name.trim();
  }

  if (updates.type && Object.values(PRODUCT_TYPES).includes(updates.type)) {
    product.type = updates.type;
  }

  if (typeof updates.salesPrice !== "undefined" && updates.salesPrice !== null) {
    const numSalesPrice = Math.round(Number(updates.salesPrice));
    if (isNaN(numSalesPrice) || numSalesPrice < 0) {
      const error = new Error("salesPrice must be a non-negative number in minor units");
      error.statusCode = 400;
      throw error;
    }
    product.salesPrice = numSalesPrice;
  }

  if (typeof updates.costPrice !== "undefined" && updates.costPrice !== null) {
    product.costPrice = Math.round(Number(updates.costPrice) || 0);
  }

  if (typeof updates.notes === "string") {
    product.notes = updates.notes.trim();
  }

  if (Array.isArray(updates.taxIds)) {
    product.taxIds = updates.taxIds;
  }

  if (Array.isArray(updates.variants)) {
    product.variants = updates.variants.map((v) => ({
      name: String(v.name || "").trim(),
      sku: String(v.sku || "").trim(),
      priceAdjustment: Math.round(Number(v.priceAdjustment) || 0),
      attributes: v.attributes || {},
      isActive: v.isActive !== false,
    }));
  }

  if (typeof updates.isActive === "boolean") {
    product.isActive = updates.isActive;
  }

  await product.save();
  await product.populate("taxIds");
  return product.toSafeObject();
};

export const updateProductStatus = async (id, isActive) => {
  const product = await Product.findById(id);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  let finalActive = true;
  if (typeof isActive === "boolean") {
    finalActive = isActive;
  } else if (typeof isActive === "string") {
    finalActive = isActive === "active" || isActive === "true";
  }

  product.isActive = finalActive;
  await product.save();
  await product.populate("taxIds");
  return product.toSafeObject();
};
