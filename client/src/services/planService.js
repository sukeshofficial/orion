// src/services/planService.js
import api from "@/api/api";

const BASE = "/api/v1/plans";

/**
 * Fetch paginated and filtered subscription plans
 * @param {Object} params - { page, limit, search, billingInterval, isActive }
 * @returns {{ success, plans, pagination }}
 */
export async function fetchPlans(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch a single plan by ID
 * @param {string} id
 * @returns {{ success, plan }}
 */
export async function fetchPlanById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new subscription plan
 * @param {Object} payload - { name, description, products, price, billingInterval, minimumQuantity, availableFrom, availableUntil, autoCloseAtExpiry, allowEarlyClosure, allowPause, allowRenewal, isActive }
 * @returns {{ success, message, plan }}
 */
export async function createPlan(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update an existing subscription plan
 * @param {string} id
 * @param {Object} payload
 * @returns {{ success, message, plan }}
 */
export async function updatePlan(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Update plan active/inactive status
 * @param {string} id
 * @param {boolean} isActive
 * @returns {{ success, message, plan }}
 */
export async function updatePlanStatus(id, isActive) {
  const { data } = await api.patch(`${BASE}/${id}/status`, { isActive });
  return data;
}

