// src/services/staffService.js
import api from "@/api/api";

const BASE = "/api/v1/admin/staff";

/**
 * Fetch staff list from real backend (Admin only)
 * GET /api/v1/admin/staff
 * @param {Object} params - { page, limit, status, search, permission }
 * @returns {{ success: boolean, staff: Array, pagination: Object }}
 */
export async function fetchStaffList(params = {}) {
  const { data } = await api.get(BASE, { params });
  return {
    staff: data.staff || data,
    pagination: data.pagination || { total: (data.staff || data).length, page: 1, limit: 10 },
  };
}

/**
 * Fetch single staff member by ID
 * GET /api/v1/admin/staff/:id
 * @param {string} id
 * @returns {{ success: boolean, staff: Object }}
 */
export async function fetchStaffById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new staff member (Admin only)
 * POST /api/v1/admin/staff
 * @param {Object} payload - { name, email, password, phone, permissions, status }
 * @returns {{ success: boolean, message: string, staff: Object }}
 */
export async function createStaff(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update staff member details / permissions (Admin only)
 * PATCH /api/v1/admin/staff/:id
 * @param {string} id
 * @param {Object} payload
 * @returns {{ success: boolean, message: string, staff: Object }}
 */
export async function updateStaff(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Update staff active / disabled status (Admin only)
 * PATCH /api/v1/admin/staff/:id/status
 * @param {string} id
 * @param {string} status - 'active' | 'disabled'
 * @returns {{ success: boolean, message: string, staff: Object }}
 */
export async function updateStaffStatus(id, status) {
  const { data } = await api.patch(`${BASE}/${id}/status`, { status });
  return data;
}

/**
 * Fetch permissions catalog from backend
 * GET /api/v1/admin/permissions/catalog
 * @returns {{ success: boolean, permissions: Array, roles: Array }}
 */
export async function fetchPermissionCatalog() {
  const { data } = await api.get("/api/v1/admin/permissions/catalog");
  return data;
}
