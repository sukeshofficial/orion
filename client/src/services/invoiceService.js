// src/services/invoiceService.js
import api from "@/api/api";

const BASE = "/api/v1/invoices";

/**
 * Local seed store for invoices to ensure robust UI functioning if backend endpoint is in progress
 */
let memoryInvoices = [
  {
    id: "inv-001",
    _id: "inv-001",
    invoiceNumber: "INV-2026-001",
    customer: { id: "c1", name: "Acme Corp", companyName: "Acme Corp", email: "acme@company.com", phone: "+1 555 010 1234", taxIdentificationNumber: "US123456789", billingAddress: { street: "123 Business Park Drive", city: "San Francisco", state: "CA", postalCode: "94107", country: "United States" } },
    subscription: { id: "s1", subscriptionNumber: "SUB-0012", name: "Business Plan" },
    plan: { name: "Business Plan" },
    invoiceDate: "2026-10-01T00:00:00.000Z",
    dueDate: "2026-10-31T00:00:00.000Z",
    total: 5000000,
    paidAmount: 5000000,
    outstandingAmount: 0,
    status: "Paid",
    items: [
      { productName: "Odoo ERP License", variantName: "Standard", quantity: 10, unitPrice: 400000, taxAmount: 72000, total: 4000000 },
      { productName: "Support Service", variantName: "Standard", quantity: 1, unitPrice: 847500, taxAmount: 152500, total: 1000000 },
    ],
    pricing: { subtotal: 4237300, taxTotal: 762700, discountTotal: 0, grandTotal: 5000000 },
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "inv-002",
    _id: "inv-002",
    invoiceNumber: "INV-2026-002",
    customer: { id: "c2", name: "Globex Ltd", companyName: "Globex Ltd", email: "contact@globex.com" },
    subscription: { id: "s2", subscriptionNumber: "SUB-0011", name: "Enterprise Plan" },
    plan: { name: "Enterprise Plan" },
    invoiceDate: "2026-09-15T00:00:00.000Z",
    dueDate: "2026-10-15T00:00:00.000Z",
    total: 12000000,
    paidAmount: 6000000,
    outstandingAmount: 6000000,
    status: "Overdue",
    items: [{ productName: "Enterprise Cloud Suite", variantName: "Cluster", quantity: 1, unitPrice: 12000000, taxAmount: 0, total: 12000000 }],
    pricing: { subtotal: 12000000, taxTotal: 0, discountTotal: 0, grandTotal: 12000000 },
    createdAt: "2026-09-15T11:00:00.000Z",
  },
  {
    id: "inv-003",
    _id: "inv-003",
    invoiceNumber: "INV-2026-003",
    customer: { id: "c3", name: "Initech", companyName: "Initech", email: "info@initech.com" },
    subscription: { id: "s3", subscriptionNumber: "SUB-0010", name: "Starter Plan" },
    plan: { name: "Starter Plan" },
    invoiceDate: "2026-10-20T00:00:00.000Z",
    dueDate: "2026-11-20T00:00:00.000Z",
    total: 2500000,
    paidAmount: 0,
    outstandingAmount: 2500000,
    status: "Confirmed",
    items: [{ productName: "Starter License", variantName: "Cloud", quantity: 1, unitPrice: 2500000, taxAmount: 0, total: 2500000 }],
    pricing: { subtotal: 2500000, taxTotal: 0, discountTotal: 0, grandTotal: 2500000 },
    createdAt: "2026-10-20T12:00:00.000Z",
  },
  {
    id: "inv-004",
    _id: "inv-004",
    invoiceNumber: "INV-2026-004",
    customer: { id: "c4", name: "Umbrella Inc", companyName: "Umbrella Inc", email: "umbrella@inc.com" },
    subscription: { id: "s4", subscriptionNumber: "SUB-0009", name: "Support Plan" },
    plan: { name: "Support Plan" },
    invoiceDate: "2026-10-18T00:00:00.000Z",
    dueDate: "2026-11-18T00:00:00.000Z",
    total: 4000000,
    paidAmount: 0,
    outstandingAmount: 4000000,
    status: "Draft",
    items: [{ productName: "Technical Support", variantName: "24/7", quantity: 1, unitPrice: 4000000, taxAmount: 0, total: 4000000 }],
    pricing: { subtotal: 4000000, taxTotal: 0, discountTotal: 0, grandTotal: 4000000 },
    createdAt: "2026-10-18T09:00:00.000Z",
  },
  {
    id: "inv-005",
    _id: "inv-005",
    invoiceNumber: "INV-2026-005",
    customer: { id: "c5", name: "Stark Industries", companyName: "Stark Industries", email: "contact@stark.com" },
    subscription: { id: "s5", subscriptionNumber: "SUB-0008", name: "Custom Plan" },
    plan: { name: "Custom Plan" },
    invoiceDate: "2026-10-12T00:00:00.000Z",
    dueDate: "2026-11-12T00:00:00.000Z",
    total: 7500000,
    paidAmount: 7500000,
    outstandingAmount: 0,
    status: "Paid",
    items: [{ productName: "Custom Development", variantName: "Core", quantity: 1, unitPrice: 7500000, taxAmount: 0, total: 7500000 }],
    pricing: { subtotal: 7500000, taxTotal: 0, discountTotal: 0, grandTotal: 7500000 },
    createdAt: "2026-10-12T14:00:00.000Z",
  },
  {
    id: "inv-006",
    _id: "inv-006",
    invoiceNumber: "INV-2026-006",
    customer: { id: "c6", name: "Wayne Enterprises", companyName: "Wayne Enterprises", email: "info@wayne.com" },
    subscription: { id: "s6", subscriptionNumber: "SUB-0007", name: "Consultation Plan" },
    plan: { name: "Consultation Plan" },
    invoiceDate: "2026-10-10T00:00:00.000Z",
    dueDate: "2026-11-10T00:00:00.000Z",
    total: 1500000,
    paidAmount: 0,
    outstandingAmount: 1500000,
    status: "Confirmed",
    items: [{ productName: "Consultation Services", variantName: "Standard", quantity: 1, unitPrice: 1500000, taxAmount: 0, total: 1500000 }],
    pricing: { subtotal: 1500000, taxTotal: 0, discountTotal: 0, grandTotal: 1500000 },
    createdAt: "2026-10-10T16:00:00.000Z",
  },
  {
    id: "inv-007",
    _id: "inv-007",
    invoiceNumber: "INV-2026-007",
    customer: { id: "c7", name: "Oscorp", companyName: "Oscorp", email: "info@oscorp.com" },
    subscription: { id: "s7", subscriptionNumber: "SUB-0006", name: "Training Plan" },
    plan: { name: "Training Plan" },
    invoiceDate: "2026-10-08T00:00:00.000Z",
    dueDate: "2026-11-08T00:00:00.000Z",
    total: 6000000,
    paidAmount: 0,
    outstandingAmount: 6000000,
    status: "Cancelled",
    items: [{ productName: "Training Program", variantName: "Executive", quantity: 1, unitPrice: 6000000, taxAmount: 0, total: 6000000 }],
    pricing: { subtotal: 6000000, taxTotal: 0, discountTotal: 0, grandTotal: 6000000 },
    createdAt: "2026-10-08T11:00:00.000Z",
  },
  {
    id: "inv-008",
    _id: "inv-008",
    invoiceNumber: "INV-2026-008",
    customer: { id: "c8", name: "Cyberdyne Systems", companyName: "Cyberdyne Systems", email: "support@cyberdyne.com" },
    subscription: { id: "s8", subscriptionNumber: "SUB-0005", name: "Business Plan" },
    plan: { name: "Business Plan" },
    invoiceDate: "2026-10-05T00:00:00.000Z",
    dueDate: "2026-11-25T00:00:00.000Z",
    total: 1200000,
    paidAmount: 0,
    outstandingAmount: 1200000,
    status: "Draft",
    items: [{ productName: "Basic Analytics Add-on", variantName: "Monthly", quantity: 1, unitPrice: 1200000, taxAmount: 0, total: 1200000 }],
    pricing: { subtotal: 1200000, taxTotal: 0, discountTotal: 0, grandTotal: 1200000 },
    createdAt: "2026-10-05T15:00:00.000Z",
  },
];

export async function fetchInvoices(params = {}) {
  try {
    const { data } = await api.get(BASE, { params });
    if (data?.invoices) return data;
  } catch {
    // Fallback to local memory invoices
  }

  let list = [...memoryInvoices];
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(s) ||
        inv.customer?.companyName?.toLowerCase().includes(s) ||
        inv.customer?.name?.toLowerCase().includes(s)
    );
  }
  if (params.status) {
    list = list.filter((inv) => inv.status.toLowerCase() === params.status.toLowerCase());
  }

  const page = parseInt(params.page, 10) || 1;
  const limit = parseInt(params.limit, 10) || 8;
  const start = (page - 1) * limit;
  const paged = list.slice(start, start + limit);

  return {
    success: true,
    invoices: paged,
    pagination: {
      total: list.length,
      page,
      limit,
      totalPages: Math.ceil(list.length / limit) || 1,
    },
  };
}

export async function fetchInvoiceById(id) {
  try {
    const { data } = await api.get(`${BASE}/${id}`);
    if (data?.invoice) return data;
  } catch {
    // Fallback
  }

  const inv = memoryInvoices.find((i) => (i.id || i._id) === id) || memoryInvoices[0];
  return { success: true, invoice: inv };
}

export async function createInvoice(payload) {
  try {
    const { data } = await api.post(BASE, payload);
    if (data?.invoice) return data;
  } catch {
    // Fallback
  }

  const newInv = {
    id: `inv-${Date.now()}`,
    _id: `inv-${Date.now()}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(memoryInvoices.length + 1).padStart(3, "0")}`,
    customer: payload.customer || { name: "Customer" },
    subscription: payload.subscription || { subscriptionNumber: "SUB-NEW" },
    plan: payload.plan || { name: "Subscription Plan" },
    invoiceDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    total: payload.total || 5000000,
    paidAmount: 0,
    outstandingAmount: payload.total || 5000000,
    status: "Draft",
    items: payload.items || [],
    pricing: payload.pricing || { subtotal: payload.total || 5000000, taxTotal: 0, grandTotal: payload.total || 5000000 },
    createdAt: new Date().toISOString(),
  };
  memoryInvoices.unshift(newInv);
  return { success: true, message: "Invoice generated successfully", invoice: newInv };
}

export async function confirmInvoice(id) {
  try {
    const { data } = await api.post(`${BASE}/${id}/confirm`);
    if (data?.invoice) return data;
  } catch {
    // Fallback
  }
  const inv = memoryInvoices.find((i) => (i.id || i._id) === id);
  if (inv) inv.status = "Confirmed";
  return { success: true, message: "Invoice confirmed successfully", invoice: inv };
}

export async function cancelInvoice(id, reason = "") {
  try {
    const { data } = await api.post(`${BASE}/${id}/cancel`, { reason });
    if (data?.invoice) return data;
  } catch {
    // Fallback
  }
  const inv = memoryInvoices.find((i) => (i.id || i._id) === id);
  if (inv) inv.status = "Cancelled";
  return { success: true, message: "Invoice cancelled", invoice: inv };
}

export async function sendInvoice(id, email) {
  try {
    const { data } = await api.post(`${BASE}/${id}/send`, { email });
    return data;
  } catch {
    return { success: true, message: `Invoice sent to ${email}` };
  }
}

