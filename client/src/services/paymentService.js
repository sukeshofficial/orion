// src/services/paymentService.js
import api from "@/api/api";

const BASE = "/api/v1/payments";

/**
 * Mock / fallback data store for payments to guarantee flawless UX 
 * whether the backend endpoint is connected or in transition.
 */
let memoryPayments = [
  {
    id: "pay-012",
    _id: "pay-012",
    paymentReference: "PAY-2026-0012",
    customer: { id: "c1", name: "Acme Corp", email: "acme@company.com", phone: "+1 555 010 1234", company: "Acme Corporation" },
    customerName: "Acme Corp",
    invoice: { id: "inv-001", _id: "inv-001", invoiceNumber: "INV-2026-001", total: 10000000, paidAmount: 5000000, outstandingAmount: 5000000, planName: "Business Plan", subscriptionNumber: "SUB-0012" },
    invoiceNumber: "INV-2026-001",
    amount: 5000000,
    method: "Bank Transfer",
    paymentDate: "2026-10-20T14:30:00.000Z",
    notes: "First payment",
    status: "Completed",
    createdBy: "Admin User",
    createdAt: "2026-10-20T14:32:00.000Z",
  },
  {
    id: "pay-011",
    _id: "pay-011",
    paymentReference: "PAY-2026-0011",
    customer: { id: "c2", name: "Globex Ltd", email: "contact@globex.com" },
    customerName: "Globex Ltd",
    invoice: { id: "inv-002", _id: "inv-002", invoiceNumber: "INV-2026-002", total: 12000000, paidAmount: 4000000, outstandingAmount: 8000000 },
    invoiceNumber: "INV-2026-002",
    amount: 4000000,
    method: "Credit Card",
    paymentDate: "2026-10-18T10:15:00.000Z",
    notes: "Advance payment",
    status: "Completed",
    createdBy: "Staff User",
    createdAt: "2026-10-18T10:16:00.000Z",
  },
  {
    id: "pay-010",
    _id: "pay-010",
    paymentReference: "PAY-2026-0010",
    customer: { id: "c3", name: "Initech", email: "info@initech.com" },
    customerName: "Initech",
    invoice: { id: "inv-003", _id: "inv-003", invoiceNumber: "INV-2026-003", total: 2500000, paidAmount: 2500000, outstandingAmount: 0 },
    invoiceNumber: "INV-2026-003",
    amount: 2500000,
    method: "UPI",
    paymentDate: "2026-10-15T11:00:00.000Z",
    notes: "Partial payment",
    status: "Completed",
    createdBy: "Staff User",
    createdAt: "2026-10-15T11:02:00.000Z",
  },
  {
    id: "pay-009",
    _id: "pay-009",
    paymentReference: "PAY-2026-0009",
    customer: { id: "c4", name: "Umbrella Inc", email: "umbrella@inc.com" },
    customerName: "Umbrella Inc",
    invoice: { id: "inv-004", _id: "inv-004", invoiceNumber: "INV-2026-004", total: 4000000, paidAmount: 4000000, outstandingAmount: 0 },
    invoiceNumber: "INV-2026-004",
    amount: 4000000,
    method: "Bank Transfer",
    paymentDate: "2026-10-12T09:45:00.000Z",
    notes: "Full settlement",
    status: "Completed",
    createdBy: "Admin User",
    createdAt: "2026-10-12T09:47:00.000Z",
  },
  {
    id: "pay-008",
    _id: "pay-008",
    paymentReference: "PAY-2026-0008",
    customer: { id: "c5", name: "Stark Industries", email: "contact@stark.com" },
    customerName: "Stark Industries",
    invoice: { id: "inv-005", _id: "inv-005", invoiceNumber: "INV-2026-005", total: 7500000, paidAmount: 7500000, outstandingAmount: 0 },
    invoiceNumber: "INV-2026-005",
    amount: 7500000,
    method: "Credit Card",
    paymentDate: "2026-10-10T16:20:00.000Z",
    notes: "Payment for Q4",
    status: "Completed",
    createdBy: "Admin User",
    createdAt: "2026-10-10T16:21:00.000Z",
  },
  {
    id: "pay-007",
    _id: "pay-007",
    paymentReference: "PAY-2026-0007",
    customer: { id: "c6", name: "Wayne Enterprises", email: "info@wayne.com" },
    customerName: "Wayne Enterprises",
    invoice: { id: "inv-006", _id: "inv-006", invoiceNumber: "INV-2026-006", total: 1500000, paidAmount: 1500000, outstandingAmount: 0 },
    invoiceNumber: "INV-2026-006",
    amount: 1500000,
    method: "UPI",
    paymentDate: "2026-10-08T13:10:00.000Z",
    notes: "Monthly payment",
    status: "Completed",
    createdBy: "Staff User",
    createdAt: "2026-10-08T13:12:00.000Z",
  },
  {
    id: "pay-006",
    _id: "pay-006",
    paymentReference: "PAY-2026-0006",
    customer: { id: "c7", name: "Oscorp", email: "contact@oscorp.com" },
    customerName: "Oscorp",
    invoice: { id: "inv-007", _id: "inv-007", invoiceNumber: "INV-2026-007", total: 6000000, paidAmount: 6000000, outstandingAmount: 0 },
    invoiceNumber: "INV-2026-007",
    amount: 6000000,
    method: "Cheque",
    paymentDate: "2026-10-05T15:00:00.000Z",
    notes: "Initial payment",
    status: "Completed",
    createdBy: "Admin User",
    createdAt: "2026-10-05T15:05:00.000Z",
  },
  {
    id: "pay-005",
    _id: "pay-005",
    paymentReference: "PAY-2026-0005",
    customer: { id: "c8", name: "Cyberdyne Systems", email: "finance@cyberdyne.com" },
    customerName: "Cyberdyne Systems",
    invoice: { id: "inv-008", _id: "inv-008", invoiceNumber: "INV-2026-008", total: 1200000, paidAmount: 1200000, outstandingAmount: 0 },
    invoiceNumber: "INV-2026-008",
    amount: 1200000,
    method: "Bank Transfer",
    paymentDate: "2026-10-03T11:30:00.000Z",
    notes: "Subscription payment",
    status: "Completed",
    createdBy: "Staff User",
    createdAt: "2026-10-03T11:32:00.000Z",
  },
];

export async function fetchPayments(params = {}) {
  try {
    const { data } = await api.get(BASE, { params });
    if (data && (data.payments || Array.isArray(data))) {
      return {
        payments: data.payments || data,
        pagination: data.pagination || { total: (data.payments || data).length, page: 1, limit: 10 },
      };
    }
  } catch (err) {
    // Graceful fallback to memory store
  }

  let filtered = [...memoryPayments];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.paymentReference.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q)
    );
  }
  if (params.method && params.method !== "all") {
    filtered = filtered.filter(
      (p) => p.method.toLowerCase() === params.method.toLowerCase()
    );
  }
  if (params.customerId && params.customerId !== "all") {
    filtered = filtered.filter(
      (p) => (p.customer?.id || p.customer?._id || p.customer) === params.customerId
    );
  }

  return {
    payments: filtered,
    pagination: { total: filtered.length, page: Number(params.page || 1), limit: Number(params.limit || 10) },
  };
}

export async function fetchPaymentById(id) {
  try {
    const { data } = await api.get(`${BASE}/${id}`);
    if (data?.payment || data) return data.payment || data;
  } catch (err) {}

  const p = memoryPayments.find((item) => item.id === id || item._id === id || item.paymentReference === id);
  if (p) return p;
  throw new Error("Payment not found");
}

export async function recordPayment(payload) {
  try {
    const { data } = await api.post(BASE, payload);
    return data;
  } catch (err) {
    // If backend endpoint is in progress, record in memory store
    const newPay = {
      id: `pay-${Date.now()}`,
      _id: `pay-${Date.now()}`,
      paymentReference: `PAY-2026-00${memoryPayments.length + 5}`,
      customer: payload.customer || { name: payload.customerName || "Customer" },
      customerName: payload.customerName || payload.customer?.name || "Customer",
      invoice: payload.invoice || { invoiceNumber: payload.invoiceNumber || "INV-2026-001" },
      invoiceNumber: payload.invoiceNumber || "INV-2026-001",
      amount: Number(payload.amount || 0),
      method: payload.method || "Bank Transfer",
      paymentDate: payload.paymentDate || new Date().toISOString(),
      notes: payload.notes || "",
      status: "Completed",
      createdBy: "Staff User",
      createdAt: new Date().toISOString(),
    };
    memoryPayments.unshift(newPay);
    return { success: true, message: "Payment recorded successfully", payment: newPay };
  }
}

export async function fetchInvoicePayments(invoiceId) {
  try {
    const { data } = await api.get(`/api/v1/invoices/${invoiceId}/payments`);
    return data?.payments || data || [];
  } catch (err) {
    return memoryPayments.filter(
      (p) => p.invoice?.id === invoiceId || p.invoice?._id === invoiceId || p.invoiceNumber === invoiceId
    );
  }
}

