// src/services/discountService.js
import api from "@/api/api";

const BASE = "/api/v1/discounts";

/**
 * Fetch paginated and filtered discounts
 * @param {Object} params - { page, limit, search, isActive, type, appliesTo }
 * @returns {{ success, discounts, pagination }}
 */
export async function fetchDiscounts(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch single discount by ID
 * @param {string} id
 * @returns {{ success, discount }}
 */
export async function fetchDiscountById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new discount
 * @param {Object} payload - { name, code, type, value, minimumPurchase, minimumQuantity, appliesTo, applicableProducts, usageLimit, startDate, endDate, isActive }
 * @returns {{ success, message, discount }}
 */
export async function createDiscount(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update an existing discount
 * @param {string} id
 * @param {Object} payload
 * @returns {{ success, message, discount }}
 */
export async function updateDiscount(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Update discount active/inactive status
 * @param {string} id
 * @param {boolean} isActive
 * @returns {{ success, message, discount }}
 */
export async function updateDiscountStatus(id, isActive) {
  const { data } = await api.patch(`${BASE}/${id}/status`, { isActive });
  return data;
}

