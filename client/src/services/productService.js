// src/services/productService.js
import api from "@/api/api";

const BASE = "/api/v1/products";

/**
 * Fetch paginated and filtered product list
 * @param {Object} params - { page, limit, search, type, isActive }
 * @returns {{ success, products, pagination }}
 */
export async function fetchProducts(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch a single product by ID (populated with taxIds)
 * @param {string} id
 * @returns {{ success, product }}
 */
export async function fetchProductById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new product
 * @param {Object} payload - { name, type, salesPrice, costPrice, notes, taxIds, variants, isActive }
 * @returns {{ success, message, product }}
 */
export async function createProduct(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update an existing product
 * @param {string} id
 * @param {Object} payload
 * @returns {{ success, message, product }}
 */
export async function updateProduct(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

/**
 * Update product active/inactive status
 * @param {string} id
 * @param {boolean} isActive
 * @returns {{ success, message, product }}
 */
export async function updateProductStatus(id, isActive) {
  const { data } = await api.patch(`${BASE}/${id}/status`, { isActive });
  return data;
}

