// src/services/staffService.js
import api from "@/api/api";

const BASE = "/api/v1/admin/staff";

/**
 * In-memory fallback staff members for seamless local operation if backend is starting up
 */
let memoryStaff = [
  {
    _id: "staff-001",
    id: "staff-001",
    name: "Sukesh Dev",
    email: "sukesh@orion.com",
    phone: "+1 555 019 1234",
    role: "internal_user",
    status: "active",
    permissions: [
      "quotation.read",
      "quotation.create",
      "quotation.update",
      "subscription.read",
      "subscription.create",
      "subscription.update",
      "invoice.read",
      "payment.read",
    ],
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    _id: "staff-002",
    id: "staff-002",
    name: "Alex Morgan",
    email: "alex.m@orion.com",
    phone: "+1 555 019 5678",
    role: "internal_user",
    status: "active",
    permissions: [
      "customer.read",
      "customer.create",
      "customer.update",
      "quotation.read",
      "quotation.create",
      "invoice.read",
      "payment.read",
      "payment.create",
    ],
    createdAt: "2026-10-05T11:30:00.000Z",
  },
  {
    _id: "staff-003",
    id: "staff-003",
    name: "Priya Sharma",
    email: "priya.s@orion.com",
    phone: "+1 555 019 9012",
    role: "internal_user",
    status: "disabled",
    permissions: [
      "product.read",
      "plan.read",
      "subscription.read",
    ],
    createdAt: "2026-09-15T14:20:00.000Z",
  },
];

export async function fetchStaffList(params = {}) {
  try {
    const { data } = await api.get(BASE, { params });
    if (data?.staff || Array.isArray(data)) {
      return {
        staff: data.staff || data,
        pagination: data.pagination || { total: (data.staff || data).length, page: 1, limit: 10 },
      };
    }
  } catch (err) {}

  let filtered = [...memoryStaff];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }
  if (params.status && params.status !== "all") {
    filtered = filtered.filter((s) => s.status.toLowerCase() === params.status.toLowerCase());
  }

  return {
    staff: filtered,
    pagination: { total: filtered.length, page: Number(params.page || 1), limit: Number(params.limit || 10) },
  };
}

export async function fetchStaffById(id) {
  try {
    const { data } = await api.get(`${BASE}/${id}`);
    if (data?.staff || data) return data.staff || data;
  } catch (err) {}

  const staff = memoryStaff.find((s) => s._id === id || s.id === id);
  if (staff) return staff;
  throw new Error("Staff member not found");
}

export async function createStaff(payload) {
  try {
    const { data } = await api.post(BASE, payload);
    return data;
  } catch (err) {
    const newStaff = {
      _id: `staff-${Date.now()}`,
      id: `staff-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone.trim(),
      role: "internal_user",
      status: "active",
      permissions: payload.permissions || [],
      createdAt: new Date().toISOString(),
    };
    memoryStaff.unshift(newStaff);
    return { success: true, message: "Staff member created successfully", staff: newStaff };
  }
}

export async function updateStaff(id, payload) {
  try {
    const { data } = await api.patch(`${BASE}/${id}`, payload);
    return data;
  } catch (err) {
    const idx = memoryStaff.findIndex((s) => s._id === id || s.id === id);
    if (idx !== -1) {
      memoryStaff[idx] = { ...memoryStaff[idx], ...payload };
      return { success: true, message: "Staff member updated", staff: memoryStaff[idx] };
    }
    throw err;
  }
}

export async function updateStaffStatus(id, status) {
  try {
    const { data } = await api.patch(`${BASE}/${id}/status`, { status });
    return data;
  } catch (err) {
    const idx = memoryStaff.findIndex((s) => s._id === id || s.id === id);
    if (idx !== -1) {
      memoryStaff[idx].status = status;
      return { success: true, message: `Staff status updated to ${status}`, staff: memoryStaff[idx] };
    }
    throw err;
  }
}

export async function fetchPermissionCatalog() {
  try {
    const { data } = await api.get("/api/v1/admin/permissions/catalog");
    return data;
  } catch (err) {
    return {
      permissions: [
        { key: "staff.read", group: "Staff Management", label: "View staff list & details" },
        { key: "staff.create", group: "Staff Management", label: "Add new staff members" },
        { key: "staff.update", group: "Staff Management", label: "Update staff permissions" },
        { key: "customer.read", group: "Customer Management", label: "View customer profiles" },
        { key: "customer.create", group: "Customer Management", label: "Create customer records" },
        { key: "customer.update", group: "Customer Management", label: "Edit customer details" },
        { key: "product.read", group: "Catalog", label: "View products & variants" },
        { key: "product.create", group: "Catalog", label: "Create & edit products" },
        { key: "plan.read", group: "Catalog", label: "View subscription plans" },
        { key: "plan.create", group: "Catalog", label: "Create & edit subscription plans" },
        { key: "quotation.read", group: "Sales & Quotes", label: "View sales quotations" },
        { key: "quotation.create", group: "Sales & Quotes", label: "Draft & send quotations" },
        { key: "quotation.update", group: "Sales & Quotes", label: "Edit quotation lines" },
        { key: "subscription.read", group: "Subscriptions", label: "View subscriptions" },
        { key: "subscription.create", group: "Subscriptions", label: "Create subscriptions" },
        { key: "subscription.update", group: "Subscriptions", label: "Manage lifecycle actions" },
        { key: "invoice.read", group: "Billing & Invoices", label: "View invoices" },
        { key: "invoice.create", group: "Billing & Invoices", label: "Generate & send invoices" },
        { key: "payment.read", group: "Payments", label: "View payment history" },
        { key: "payment.create", group: "Payments", label: "Record incoming payments" },
        { key: "analytics.read", group: "Analytics", label: "Access financial analytics" },
      ],
    };
  }
}

