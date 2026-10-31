// src/services/paymentService.js
import api from "@/api/api";

const BASE = "/api/v1/payments";

/**
 * Fetch paginated and filtered payments from real backend
 * GET /api/v1/payments
 * @param {Object} params - { page, limit, search, status, method, customerId, invoiceId }
 * @returns {{ success: boolean, payments: Array, pagination: Object, stats: Object }}
 */
export async function fetchPayments(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch single payment by ID from real backend
 * GET /api/v1/payments/:id
 * @param {string} id
 * @returns {{ success: boolean, payment: Object }}
 */
export async function fetchPaymentById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Record a new payment against an invoice on the real backend
 * POST /api/v1/payments
 * @param {Object} payload - { invoiceId, amount, paymentMethod / method, notes, idempotencyKey, reference }
 * @returns {{ success: boolean, message: string, payment: Object, invoice: Object }}
 */
export async function recordPayment(payload) {
  const methodRaw = (payload.paymentMethod || payload.method || "").toLowerCase().replace(/[\s-]+/g, "_");
  const validMethods = ["credit_card", "debit_card", "bank_transfer", "upi", "cash", "other"];
  const paymentMethod = validMethods.includes(methodRaw) ? methodRaw : "bank_transfer";

  const body = {
    invoiceId: payload.invoiceId || payload.invoice?._id || payload.invoice?.id,
    amount: Number(payload.amount),
    paymentMethod,
    notes: payload.notes || "",
    reference: payload.reference || payload.paymentReference,
    idempotencyKey: payload.idempotencyKey,
  };

  const { data } = await api.post(BASE, body);
  return data;
}

/**
 * Fetch payments associated with a specific invoice
 * GET /api/v1/invoices/:id/payments
 * @param {string} invoiceId
 * @returns {{ success: boolean, payments: Array }}
 */
export async function fetchPaymentsForInvoice(invoiceId) {
  const { data } = await api.get(`/api/v1/invoices/${invoiceId}/payments`);
  return data;
}

export const fetchInvoicePayments = fetchPaymentsForInvoice;

/**
 * Fetch real aggregate payment statistics
 * @returns {{ totalPayments: number, totalCollected: number, pendingAmount: number, fullyPaidCount: number, partiallyPaidCount: number }}
 */
export async function fetchPaymentStats() {
  const { data } = await api.get(BASE, { params: { limit: 100 } });
  const list = data?.payments || [];
  
  const totalPayments = data?.pagination?.total ?? list.length;
  const totalCollected = list
    .filter((p) => (p.status || "").toLowerCase() === "completed")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return {
    totalPayments,
    totalCollected,
  };
}
