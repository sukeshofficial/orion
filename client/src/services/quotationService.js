// src/services/quotationService.js
import api from "@/api/api";

const BASE = "/api/v1/quotations";

/**
 * Fetch paginated and filtered quotations
 * @param {Object} params - { page, limit, search, status, customerId, planId }
 * @returns {{ success, quotations, pagination }}
 */
export async function fetchQuotations(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch a single quotation by ID
 * @param {string} id
 * @returns {{ success, quotation }}
 */
export async function fetchQuotationById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new quotation
 * @param {Object} payload - { customerId, templateId, planId, lines, startDate, expiryDate, paymentTerms, discountId }
 * @returns {{ success, message, quotation }}
 */
export async function createQuotation(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update an existing quotation
 * @param {string} id
 * @param {Object} payload
 * @returns {{ success, message, quotation }}
 */
export async function updateQuotation(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Confirm a quotation
 * @param {string} id
 * @returns {{ success, message, quotation }}
 */
export async function confirmQuotation(id) {
  const { data } = await api.post(`${BASE}/${id}/confirm`);
  return data;
}

/**
 * Cancel a quotation
 * @param {string} id
 * @param {string} reason
 * @returns {{ success, message, quotation }}
 */
export async function cancelQuotation(id, reason = "") {
  const { data } = await api.post(`${BASE}/${id}/cancel`, { reason });
  return data;
}

/**
 * Convert quotation to subscription
 * @param {string} id
 * @returns {{ success, message, subscription }}
 */
export async function convertQuotationToSubscription(id) {
  const { data } = await api.post(`${BASE}/${id}/convert`);
  return data;
}

