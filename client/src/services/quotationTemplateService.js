// src/services/quotationTemplateService.js
import api from "@/api/api";

const BASE = "/api/v1/quotation-templates";

/**
 * Fetch paginated and filtered quotation templates
 * @param {Object} params - { page, limit, search, planId, isActive }
 * @returns {{ success, templates, pagination }}
 */
export async function fetchQuotationTemplates(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

/**
 * Fetch a single quotation template by ID
 * @param {string} id
 * @returns {{ success, template }}
 */
export async function fetchQuotationTemplateById(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

/**
 * Create a new quotation template
 * @param {Object} payload - { name, planId, productLines, validityDays, isActive }
 * @returns {{ success, message, template }}
 */
export async function createQuotationTemplate(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

/**
 * Update an existing quotation template
 * @param {string} id
 * @param {Object} payload
 * @returns {{ success, message, template }}
 */
export async function updateQuotationTemplate(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

