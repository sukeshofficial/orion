// src/services/subscriptionService.js
import api from "@/api/api";

const BASE = "/api/v1/subscriptions";

/**
 * Fetch paginated and filtered subscriptions
 * @param {Object} params - { page, limit, search, status, customerId, planId }
 * @returns {{ success, subscriptions, pagination }}
 */
export async function fetchSubscriptions(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch a single subscription by ID
 * @param {string} id
 * @returns {{ success, subscription }}
 */
export async function fetchSubscriptionById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new subscription directly
 * @param {Object} payload - { customerId, planId, lines, startDate, paymentTerms, quotationId }
 * @returns {{ success, message, subscription }}
 */
export async function createSubscription(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update subscription settings
 * @param {string} id
 * @param {Object} payload
 * @returns {{ success, message, subscription }}
 */
export async function updateSubscription(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Confirm subscription
 * @param {string} id
 */
export async function confirmSubscription(id) {
  const { data } = await api.post(`${BASE}/${id}/confirm`);
  return data;
}

/**
 * Activate subscription
 * @param {string} id
 */
export async function activateSubscription(id) {
  const { data } = await api.post(`${BASE}/${id}/activate`);
  return data;
}

/**
 * Pause subscription
 * @param {string} id
 * @param {string} reason
 */
export async function pauseSubscription(id, reason = "") {
  const { data } = await api.post(`${BASE}/${id}/pause`, { reason });
  return data;
}

/**
 * Resume subscription
 * @param {string} id
 */
export async function resumeSubscription(id) {
  const { data } = await api.post(`${BASE}/${id}/resume`);
  return data;
}

/**
 * Renew subscription
 * @param {string} id
 */
export async function renewSubscription(id) {
  const { data } = await api.post(`${BASE}/${id}/renew`);
  return data;
}

/**
 * Close subscription
 * @param {string} id
 * @param {string} reason
 */
export async function closeSubscription(id, reason = "") {
  const { data } = await api.post(`${BASE}/${id}/close`, { reason });
  return data;
}

