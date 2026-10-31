// src/services/invoiceService.js
import api from "@/api/api";

const BASE = "/api/v1/invoices";

/**
 * Fetch paginated and filtered invoices from real backend
 * GET /api/v1/invoices
 * @param {Object} params - { page, limit, search, status, customerId, subscriptionId }
 * @returns {{ success: boolean, invoices: Array, pagination: Object }}
 */
export async function fetchInvoices(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch single invoice by ID from real backend
 * GET /api/v1/invoices/:id
 * @param {string} id
 * @returns {{ success: boolean, invoice: Object }}
 */
export async function fetchInvoiceById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Generate invoice from subscription
 * POST /api/v1/invoices/generate
 * @param {Object} payload - { subscriptionId }
 * @returns {{ success: boolean, message: string, invoice: Object }}
 */
export async function createInvoice(payload) {
  const subscriptionId =
    payload.subscriptionId ||
    payload.subscription?._id ||
    payload.subscription?.id ||
    payload.id;

  const { data } = await api.post(`${BASE}/generate`, { subscriptionId });
  return data;
}

/**
 * Confirm a draft invoice
 * POST /api/v1/invoices/:id/confirm
 * @param {string} id
 * @returns {{ success: boolean, message: string, invoice: Object }}
 */
export async function confirmInvoice(id) {
  const { data } = await api.post(`${BASE}/${id}/confirm`);
  return data;
}

/**
 * Cancel an invoice
 * POST /api/v1/invoices/:id/cancel
 * @param {string} id
 * @param {string} reason
 * @returns {{ success: boolean, message: string, invoice: Object }}
 */
export async function cancelInvoice(id, reason = "") {
  const { data } = await api.post(`${BASE}/${id}/cancel`, { reason });
  return data;
}

/**
 * Send an invoice via email
 * POST /api/v1/invoices/:id/send
 * @param {string} id
 * @param {string} email
 * @returns {{ success: boolean, message: string }}
 */
export async function sendInvoice(id, email) {
  const { data } = await api.post(`${BASE}/${id}/send`, { email });
  return data;
}

/**
 * Download invoice PDF as blob
 * GET /api/v1/invoices/:id/pdf
 * @param {string} id
 * @returns {Blob}
 */
export async function fetchInvoicePdf(id) {
  const response = await api.get(`${BASE}/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
}
