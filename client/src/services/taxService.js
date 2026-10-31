// src/services/taxService.js
import api from "@/api/api";

const BASE = "/api/v1/taxes";

/**
 * Fetch paginated and filtered tax list
 * @param {Object} params - { page, limit, search, isActive }
 * @returns {{ success, taxes, pagination }}
 */
export async function fetchTaxes(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch a single tax by ID
 * @param {string} id
 * @returns {{ success, tax }}
 */
export async function fetchTaxById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new tax
 * @param {Object} payload - { name, rate, description, isDefault }
 * @returns {{ success, message, tax }}
 */
export async function createTax(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update an existing tax
 * @param {string} id
 * @param {Object} payload - { name, rate, description, isDefault }
 * @returns {{ success, message, tax }}
 */
export async function updateTax(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Update tax active/inactive status
 * @param {string} id
 * @param {boolean} isActive
 * @returns {{ success, message, tax }}
 */
export async function updateTaxStatus(id, isActive) {
  const { data } = await api.patch(`${BASE}/${id}/status`, { isActive });
  return data;
}

