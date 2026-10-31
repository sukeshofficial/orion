// src/services/analyticsService.js
import api from "@/api/api";

const BASE = "/api/v1/analytics";

/**
 * Fetch overview analytics
 * GET /api/v1/analytics/overview
 */
export async function fetchAnalyticsOverview(params = {}) {
  const { data } = await api.get(`${BASE}/overview`, { params });
  return {
    activeSubscriptions: data.activeSubscriptions ?? 0,
    activeSubscriptionsGrowth: data.activeSubscriptionsGrowth ?? 0,
    revenueCollected: data.totalRevenueCollected ?? data.revenueCollected ?? 0,
    revenueGrowth: data.revenueGrowth ?? 0,
    outstandingAmount: data.outstandingAmounts ?? data.outstandingAmount ?? 0,
    outstandingDecrease: data.outstandingDecrease ?? 0,
    overdueInvoices: typeof data.overdueInvoices === "object" ? (data.overdueInvoices?.count ?? 0) : (data.overdueInvoices ?? 0),
    overdueDecrease: data.overdueDecrease ?? 0,
    upcomingRenewals: data.upcomingRenewals ?? 0,
    renewalsGrowth: data.renewalsGrowth ?? 0,
  };
}

/**
 * Fetch revenue analytics grouped by time
 * GET /api/v1/analytics/revenue?groupBy=day|month|quarter|year
 */
export async function fetchRevenueAnalytics(params = {}) {
  const groupBy = params.granularity || params.groupBy || "month";
  const { data } = await api.get(`${BASE}/revenue`, { params: { ...params, groupBy } });
  return {
    granularity: data.groupBy || groupBy,
    totalCollected: data.totalCollected ?? 0,
    data: data.data || [],
  };
}

/**
 * Fetch subscription status and plan distribution analytics
 * GET /api/v1/analytics/subscriptions
 */
export async function fetchSubscriptionAnalytics(params = {}) {
  const { data } = await api.get(`${BASE}/subscriptions`, { params });
  return {
    total: data.totalSubscriptions ?? data.total ?? 0,
    activeCount: data.activeSubscriptions ?? 0,
    closedCount: data.closedSubscriptions ?? 0,
    pausedCount: data.pausedSubscriptions ?? 0,
    confirmedCount: data.confirmedSubscriptions ?? 0,
    statusBreakdown: data.statusBreakdown || {},
    byPlan: data.byPlan || [],
    upcomingRenewals: data.upcomingRenewals || [],
  };
}

/**
 * Fetch invoice distribution analytics
 * GET /api/v1/analytics/invoices
 */
export async function fetchInvoiceAnalytics(params = {}) {
  const { data } = await api.get(`${BASE}/invoices`, { params });
  return {
    total: data.totalInvoices ?? 0,
    draftCount: data.draftInvoices ?? 0,
    confirmedCount: data.confirmedInvoices ?? 0,
    paidCount: data.paidInvoices ?? 0,
    overdueCount: data.overdueInvoices ?? 0,
    overdueAmount: data.overdueAmount ?? 0,
    totalBilled: data.totalBilled ?? 0,
    totalPaid: data.totalPaid ?? 0,
    outstandingBalances: data.outstandingBalances ?? 0,
    breakdown: data.breakdown || [],
  };
}

/**
 * Fetch payment analytics by method and time
 * GET /api/v1/analytics/payments
 */
export async function fetchPaymentAnalytics(params = {}) {
  const { data } = await api.get(`${BASE}/payments`, { params });
  return {
    totalPayments: data.summary?.count ?? data.totalPayments ?? 0,
    totalVolume: data.summary?.totalAmount ?? data.totalVolume ?? 0,
    byMethod: data.byMethod || [],
    byDate: data.byDate || [],
  };
}
