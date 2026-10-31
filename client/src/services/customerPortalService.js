// src/services/customerPortalService.js
import api from "@/api/api";

/**
 * Fetch overview statistics for the logged-in customer from real backend records
 */
export async function fetchPortalOverview() {
  const [subRes, invRes, payRes] = await Promise.all([
    api.get("/api/v1/subscriptions"),
    api.get("/api/v1/invoices"),
    api.get("/api/v1/payments"),
  ]);

  const subs = subRes.data?.subscriptions || subRes.data || [];
  const invoices = invRes.data?.invoices || invRes.data || [];
  const payments = payRes.data?.payments || payRes.data || [];

  const activeSubs = subs.filter(
    (s) => (s.status || "").toLowerCase() === "active"
  );

  const now = new Date();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingRenewals = activeSubs.filter((s) => {
    if (!s.expiryDate) return false;
    const exp = new Date(s.expiryDate);
    return exp >= now && exp <= thirtyDaysAhead;
  });

  const unpaidInvoices = invoices.filter((i) => {
    const st = (i.status || "").toLowerCase();
    return st !== "paid" && st !== "cancelled";
  });

  const totalOutstanding = unpaidInvoices.reduce(
    (acc, i) => acc + (i.amountDue ?? i.outstandingAmount ?? 0),
    0
  );

  const totalRecentPayments = payments.reduce(
    (acc, p) => acc + (p.amount || 0),
    0
  );

  return {
    activeSubscriptions: activeSubs.length,
    activeSubscriptionsGrowth: 0,
    upcomingRenewals: upcomingRenewals.length,
    upcomingRenewalsDate: upcomingRenewals[0]?.expiryDate || null,
    outstandingInvoices: totalOutstanding,
    outstandingCount: unpaidInvoices.length,
    recentPayments: totalRecentPayments,
    lastPaymentDate: payments[0]?.paymentDate || payments[0]?.createdAt || null,
    subscriptions: subs,
    invoices,
    payments,
  };
}

/**
 * Fetch customer self-service profile
 * GET /api/v1/customers/me
 */
export async function fetchPortalProfile() {
  try {
    const { data } = await api.get("/api/v1/customers/me");
    if (data?.customer) return data.customer;
  } catch (err) {
    // If no customer profile document exists yet, fall back to /api/v1/auth/me
    const { data } = await api.get("/api/v1/auth/me");
    return data?.user || null;
  }
}

/**
 * Update customer self-service profile
 * PATCH /api/v1/customers/me
 */
export async function updatePortalProfile(payload) {
  const { data } = await api.patch("/api/v1/customers/me", payload);
  return data;
}

/**
 * Change current authenticated user password
 * PATCH /api/v1/auth/me/password
 */
export async function changePassword(payload) {
  const { data } = await api.patch("/api/v1/auth/me/password", payload);
  return data;
}
