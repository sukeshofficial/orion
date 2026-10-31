import Product from "../models/product.model.js";
import Tax from "../models/tax.model.js";

/**
 * Reusable Pricing Calculation Engine
 * Calculates base price, variant adjustment, quantity multiplication,
 * taxable amount, tax amount, and line totals using integer minor units.
 */

/**
 * Calculate single item line total and tax breakdown.
 *
 * @param {object} params
 * @param {string|object} params.productId - Product ID or Product document
 * @param {string} [params.variantId] - Optional variant ID
 * @param {number} [params.quantity=1] - Item quantity
 * @param {number[]} [params.customTaxRates] - Optional override tax rates (percentages e.g. 10 for 10%)
 * @returns {Promise<object>} Line item pricing breakdown
 */
export const calculateLineItemPrice = async ({
  productId,
  variantId = null,
  quantity = 1,
  customTaxRates = null,
}) => {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  // 1. Resolve product
  let product = null;
  if (typeof productId === "object" && productId?.salesPrice !== undefined) {
    product = productId;
  } else {
    product = await Product.findById(productId).populate("taxIds");
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }
  }

  // 2. Base sales price (in minor units)
  const basePrice = Math.round(product.salesPrice || 0);

  // 3. Variant adjustment (in minor units)
  let variantAdjustment = 0;
  let selectedVariant = null;

  if (variantId && product.variants?.length > 0) {
    selectedVariant = product.variants.find(
      (v) => (v._id ? v._id.toString() : v.id) === variantId.toString()
    );
    if (!selectedVariant) {
      const error = new Error(`Variant ${variantId} not found on product`);
      error.statusCode = 400;
      throw error;
    }
    variantAdjustment = Math.round(selectedVariant.priceAdjustment || 0);
  }

  // Unit price = base + variant adjustment (cannot be negative)
  const unitPrice = Math.max(0, basePrice + variantAdjustment);

  // Taxable subtotal for this item line
  const taxableAmount = unitPrice * qty;

  // 4. Resolve tax rates
  let taxRates = [];
  if (Array.isArray(customTaxRates)) {
    taxRates = customTaxRates;
  } else if (product.taxIds && product.taxIds.length > 0) {
    // If populated or needs population
    taxRates = product.taxIds.map((t) => {
      if (typeof t === "object" && t.rate !== undefined) {
        return t.isActive !== false ? t.rate : 0;
      }
      return 0; // if unpopulated, or handled by caller
    });
  }

  // Sum active tax percentages
  const effectiveTaxRate = taxRates.reduce((acc, rate) => acc + (Number(rate) || 0), 0);

  // Tax amount in minor units = round(taxableAmount * (rate / 100))
  const taxAmount = Math.round((taxableAmount * effectiveTaxRate) / 100);

  // Line total = taxable amount + tax amount
  const lineTotal = taxableAmount + taxAmount;

  return {
    productId: product._id ? product._id.toString() : product.id,
    productName: product.name,
    variantId: selectedVariant ? (selectedVariant._id ? selectedVariant._id.toString() : selectedVariant.id) : null,
    variantName: selectedVariant ? selectedVariant.name : null,
    basePrice,
    variantAdjustment,
    unitPrice,
    quantity: qty,
    taxableAmount,
    effectiveTaxRate,
    taxAmount,
    lineTotal,
  };
};

/**
 * Calculate totals for a collection of line items.
 *
 * @param {Array<{ productId: string, variantId?: string, quantity: number }>} items
 * @returns {Promise<object>} Cart / Order pricing calculation
 */
export const calculateOrderTotals = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      items: [],
    };
  }

  const lineItems = await Promise.all(
    items.map((item) =>
      calculateLineItemPrice({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })
    )
  );

  const subtotal = lineItems.reduce((acc, item) => acc + item.taxableAmount, 0);
  const taxAmount = lineItems.reduce((acc, item) => acc + item.taxAmount, 0);
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    total,
    items: lineItems,
  };
};
