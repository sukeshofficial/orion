// src/services/customerService.js
import api from "@/api/api";

const BASE = "/api/v1/customers";

/**
 * Fetch paginated / filtered customer list
 * @param {Object} params - { page, limit, search, status }
 * @returns {{ success, customers, pagination }}
 */
export async function fetchCustomers(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Create a new customer
 * @param {Object} payload - { userId, companyName, phone, billingAddress, taxIdentificationNumber }
 * @returns {{ success, message, customer }}
 */
export async function createCustomer(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Fetch a single customer by ID (userId is populated)
 * @param {string} id
 * @returns {{ success, customer }}
 */
export async function fetchCustomerById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Update an existing customer
 * @param {string} id
 * @param {Object} payload - { companyName, phone, billingAddress, taxIdentificationNumber, isActive }
 * @returns {{ success, message, customer }}
 */
export async function updateCustomer(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Fetch subscriptions for a customer
 * @param {string} id
 * @returns {{ success, subscriptions }}
 */
export async function fetchCustomerSubscriptions(id) {
  const { data } = await api.get(`${BASE}/${id}/subscriptions`);
  return data;
}

/**
 * Fetch invoices for a customer
 * @param {string} id
 * @returns {{ success, invoices }}
 */
export async function fetchCustomerInvoices(id) {
  const { data } = await api.get(`${BASE}/${id}/invoices`);
  return data;
}

/**
 * Look up an existing user by email to associate with a customer profile
 * GET /api/v1/admin/users?search=<email>
 * @param {string} email
 * @returns {Promise<{ success: boolean, users: Array }>}
 */
export async function lookupUserByEmail(email) {
  const { data } = await api.get("/api/v1/admin/users", {
    params: { search: email.trim() },
  });
  return data;
}


