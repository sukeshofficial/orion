import Tax, { TAX_STATUS } from "../models/tax.model.js";

/**
 * Tax Service
 * CRUD and status toggles for tax percentage rates.
 */

export const createTax = async ({ name, rate, description, isDefault, userId }) => {
  if (!name || typeof rate === "undefined" || rate === null) {
    const error = new Error("Tax name and rate are required");
    error.statusCode = 400;
    throw error;
  }

  const numericRate = Number(rate);
  if (isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
    const error = new Error("Tax rate must be a valid percentage between 0 and 100");
    error.statusCode = 400;
    throw error;
  }

  const tax = new Tax({
    name: name.trim(),
    rate: numericRate,
    description: description ? description.trim() : "",
    isDefault: Boolean(isDefault),
    isActive: true,
    createdBy: userId,
  });

  await tax.save();
  return tax.toSafeObject();
};

export const listTaxes = async ({ page = 1, limit = 50, isActive, search } = {}) => {
  const query = {};

  if (typeof isActive !== "undefined" && isActive !== null && isActive !== "") {
    query.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    query.name = new RegExp(search, "i");
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [taxes, total] = await Promise.all([
    Tax.find(query).sort({ createdAt: -1 }).skip(skip).limit(take),
    Tax.countDocuments(query),
  ]);

  return {
    taxes: taxes.map((t) => t.toSafeObject()),
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getTaxById = async (id) => {
  const tax = await Tax.findById(id);
  if (!tax) {
    const error = new Error("Tax configuration not found");
    error.statusCode = 404;
    throw error;
  }
  return tax.toSafeObject();
};

export const updateTax = async (id, updates = {}) => {
  const tax = await Tax.findById(id);
  if (!tax) {
    const error = new Error("Tax configuration not found");
    error.statusCode = 404;
    throw error;
  }

  if (typeof updates.name === "string" && updates.name.trim()) {
    tax.name = updates.name.trim();
  }

  if (typeof updates.rate !== "undefined" && updates.rate !== null) {
    const numericRate = Number(updates.rate);
    if (isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
      const error = new Error("Tax rate must be a valid percentage between 0 and 100");
      error.statusCode = 400;
      throw error;
    }
    tax.rate = numericRate;
  }

  if (typeof updates.description === "string") {
    tax.description = updates.description.trim();
  }

  if (typeof updates.isDefault === "boolean") {
    tax.isDefault = updates.isDefault;
  }

  if (typeof updates.isActive === "boolean") {
    tax.isActive = updates.isActive;
  }

  await tax.save();
  return tax.toSafeObject();
};

export const updateTaxStatus = async (id, isActive) => {
  const tax = await Tax.findById(id);
  if (!tax) {
    const error = new Error("Tax configuration not found");
    error.statusCode = 404;
    throw error;
  }

  let finalActive = true;
  if (typeof isActive === "boolean") {
    finalActive = isActive;
  } else if (typeof isActive === "string") {
    finalActive = isActive === "active" || isActive === "true";
  }

  tax.isActive = finalActive;
  await tax.save();
  return tax.toSafeObject();
};
