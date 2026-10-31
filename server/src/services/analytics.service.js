import Subscription, {
  SUBSCRIPTION_STATUS,
} from "../models/subscription.model.js";
import Invoice, { INVOICE_STATUS } from "../models/invoice.model.js";
import Payment, { PAYMENT_STATUS } from "../models/payment.model.js";

/**
 * Analytics and Reporting Service
 * Uses performant MongoDB aggregation pipelines.
 * Definitions:
 *   - Collected revenue = actual recorded payments (status: Completed)
 *   - Outstanding amount = outstanding invoice balances (amountDue across non-cancelled invoices)
 *   - Overdue invoices = confirmed/partially paid/overdue invoices past due with amountDue > 0
 *   - Active subscriptions = subscriptions with status === Active
 */

/**
 * Helper to build date range match conditions.
 */
const buildDateFilter = (field, startDate, endDate) => {
  const filter = {};
  if (startDate) {
    const s = new Date(startDate);
    if (!isNaN(s.getTime())) {
      filter.$gte = s;
    }
  }
  if (endDate) {
    const e = new Date(endDate);
    if (!isNaN(e.getTime())) {
      filter.$lte = e;
    }
  }
  return Object.keys(filter).length > 0 ? { [field]: filter } : {};
};

/**
 * 1. Overview Analytics
 * GET /api/v1/analytics/overview
 */
export const getOverviewAnalytics = async (query = {}) => {
  const now = new Date();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    activeSubscriptionsCount,
    revenueResult,
    outstandingResult,
    overdueResult,
    upcomingRenewalsCount,
  ] = await Promise.all([
    // Active subscriptions
    Subscription.countDocuments({ status: SUBSCRIPTION_STATUS.ACTIVE }),

    // Total collected revenue from completed payments
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      { $group: { _id: null, totalCollected: { $sum: "$amount" } } },
    ]),

    // Total outstanding amounts from invoices not cancelled/draft/paid
    Invoice.aggregate([
      {
        $match: {
          status: { $nin: [INVOICE_STATUS.CANCELLED, INVOICE_STATUS.DRAFT, INVOICE_STATUS.PAID] },
          amountDue: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: "$amountDue" },
          count: { $sum: 1 },
        },
      },
    ]),

    // Overdue invoices: confirmed / partially paid with dueDate < now and amountDue > 0
    Invoice.aggregate([
      {
        $match: {
          status: { $nin: [INVOICE_STATUS.CANCELLED, INVOICE_STATUS.DRAFT, INVOICE_STATUS.PAID] },
          amountDue: { $gt: 0 },
          dueDate: { $lt: now },
        },
      },
      {
        $group: {
          _id: null,
          overdueCount: { $sum: 1 },
          overdueAmount: { $sum: "$amountDue" },
        },
      },
    ]),

    // Upcoming renewals in next 30 days (active subscriptions)
    Subscription.countDocuments({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiryDate: { $gte: now, $lte: thirtyDaysAhead },
    }),
  ]);

  const totalRevenueCollected = revenueResult[0]?.totalCollected || 0;
  const outstandingAmounts = outstandingResult[0]?.totalOutstanding || 0;
  const overdueCount = overdueResult[0]?.overdueCount || 0;
  const overdueAmount = overdueResult[0]?.overdueAmount || 0;

  return {
    activeSubscriptions: activeSubscriptionsCount,
    totalRevenueCollected,
    outstandingAmounts,
    overdueInvoices: {
      count: overdueCount,
      amount: overdueAmount,
    },
    upcomingRenewals: upcomingRenewalsCount,
  };
};

/**
 * 2. Revenue Analytics
 * GET /api/v1/analytics/revenue?startDate=&endDate=&groupBy=day|month|quarter|year
 */
export const getRevenueAnalytics = async ({
  startDate,
  endDate,
  groupBy = "month",
} = {}) => {
  const matchStage = {
    status: PAYMENT_STATUS.COMPLETED,
    ...buildDateFilter("paymentDate", startDate, endDate),
  };

  let groupFormat;
  switch (String(groupBy).toLowerCase()) {
    case "day":
      groupFormat = {
        year: { $year: "$paymentDate" },
        month: { $month: "$paymentDate" },
        day: { $dayOfMonth: "$paymentDate" },
      };
      break;
    case "quarter":
      groupFormat = {
        year: { $year: "$paymentDate" },
        quarter: {
          $ceil: { $divide: [{ $month: "$paymentDate" }, 3] },
        },
      };
      break;
    case "year":
      groupFormat = {
        year: { $year: "$paymentDate" },
      };
      break;
    case "month":
    default:
      groupFormat = {
        year: { $year: "$paymentDate" },
        month: { $month: "$paymentDate" },
      };
      break;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: groupFormat,
        totalRevenue: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.quarter": 1 } },
  ];

  const results = await Payment.aggregate(pipeline);

  const formatted = results.map((row) => {
    let periodKey = "";
    if (row._id.quarter) {
      periodKey = `${row._id.year}-Q${row._id.quarter}`;
    } else if (row._id.day) {
      periodKey = `${row._id.year}-${String(row._id.month).padStart(2, "0")}-${String(row._id.day).padStart(2, "0")}`;
    } else if (row._id.month) {
      periodKey = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    } else {
      periodKey = `${row._id.year}`;
    }

    return {
      period: periodKey,
      ...row._id,
      totalRevenue: row.totalRevenue,
      paymentCount: row.paymentCount,
    };
  });

  const totalCollected = formatted.reduce((acc, r) => acc + r.totalRevenue, 0);

  return {
    groupBy: String(groupBy).toLowerCase(),
    totalCollected,
    data: formatted,
  };
};

/**
 * 3. Subscription Analytics
 * GET /api/v1/analytics/subscriptions
 */
export const getSubscriptionAnalytics = async () => {
  const now = new Date();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [statusBreakdown, planBreakdown, upcomingRenewals] = await Promise.all([
    // Group by status
    Subscription.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
        },
      },
    ]),

    // Group by plan
    Subscription.aggregate([
      {
        $group: {
          _id: "$planId",
          planName: { $first: "$planSnapshot.name" },
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$status", SUBSCRIPTION_STATUS.ACTIVE] }, 1, 0] },
          },
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "_id",
          foreignField: "_id",
          as: "planDoc",
        },
      },
      {
        $project: {
          planId: "$_id",
          planName: {
            $ifNull: ["$planName", { $arrayElemAt: ["$planDoc.name", 0] }],
          },
          count: 1,
          activeCount: 1,
          totalRevenue: 1,
        },
      },
    ]),

    // Upcoming renewals list
    Subscription.find({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiryDate: { $gte: now, $lte: thirtyDaysAhead },
    })
      .sort({ expiryDate: 1 })
      .limit(20)
      .populate("customerId", "companyName customerNumber")
      .populate("planId", "name billingInterval"),
  ]);

  const countsByStatus = {};
  for (const s of Object.values(SUBSCRIPTION_STATUS)) {
    countsByStatus[s] = 0;
  }
  for (const row of statusBreakdown) {
    if (row._id) countsByStatus[row._id] = row.count;
  }

  return {
    activeSubscriptions: countsByStatus[SUBSCRIPTION_STATUS.ACTIVE] || 0,
    closedSubscriptions: countsByStatus[SUBSCRIPTION_STATUS.CLOSED] || 0,
    pausedSubscriptions: countsByStatus[SUBSCRIPTION_STATUS.PAUSED] || 0,
    confirmedSubscriptions: countsByStatus[SUBSCRIPTION_STATUS.CONFIRMED] || 0,
    totalSubscriptions: Object.values(countsByStatus).reduce((a, b) => a + b, 0),
    statusBreakdown: countsByStatus,
    byPlan: planBreakdown,
    upcomingRenewals: upcomingRenewals.map((s) => s.toSafeObject()),
  };
};

/**
 * 4. Invoice Analytics
 * GET /api/v1/analytics/invoices
 */
export const getInvoiceAnalytics = async ({ startDate, endDate } = {}) => {
  const now = new Date();
  const matchStage = buildDateFilter("issueDate", startDate, endDate);

  const [statusAggregation, overdueAggregation] = await Promise.all([
    Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          amountPaid: { $sum: "$amountPaid" },
          amountDue: { $sum: "$amountDue" },
        },
      },
    ]),

    // Overdue analysis
    Invoice.aggregate([
      {
        $match: {
          ...matchStage,
          status: { $nin: [INVOICE_STATUS.CANCELLED, INVOICE_STATUS.DRAFT, INVOICE_STATUS.PAID] },
          amountDue: { $gt: 0 },
          dueDate: { $lt: now },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          overdueAmount: { $sum: "$amountDue" },
        },
      },
    ]),
  ]);

  let totalInvoices = 0;
  let draftInvoices = 0;
  let confirmedInvoices = 0;
  let paidInvoices = 0;
  let totalBilled = 0;
  let totalPaid = 0;
  let outstandingBalances = 0;

  for (const row of statusAggregation) {
    totalInvoices += row.count;
    totalBilled += row.totalAmount;
    totalPaid += row.amountPaid;

    if (row._id !== INVOICE_STATUS.CANCELLED && row._id !== INVOICE_STATUS.DRAFT) {
      outstandingBalances += row.amountDue;
    }

    if (row._id === INVOICE_STATUS.DRAFT) draftInvoices = row.count;
    if (row._id === INVOICE_STATUS.CONFIRMED) confirmedInvoices = row.count;
    if (row._id === INVOICE_STATUS.PAID) paidInvoices = row.count;
  }

  const overdueInvoices = overdueAggregation[0]?.count || 0;
  const overdueAmount = overdueAggregation[0]?.overdueAmount || 0;

  return {
    totalInvoices,
    draftInvoices,
    confirmedInvoices,
    paidInvoices,
    overdueInvoices,
    overdueAmount,
    totalBilled,
    totalPaid,
    outstandingBalances,
    breakdown: statusAggregation,
  };
};

/**
 * 5. Payment Analytics
 * GET /api/v1/analytics/payments?startDate=&endDate=&groupBy=date|method
 */
export const getPaymentAnalytics = async ({
  startDate,
  endDate,
  groupBy = "date",
} = {}) => {
  const matchStage = {
    status: PAYMENT_STATUS.COMPLETED,
    ...buildDateFilter("paymentDate", startDate, endDate),
  };

  const [summary, byMethod, byDate] = await Promise.all([
    // Total payments received
    Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),

    // Grouped by method
    Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),

    // Grouped by date (day)
    Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
            day: { $dayOfMonth: "$paymentDate" },
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),
  ]);

  const totalPaymentsReceived = summary[0]?.totalAmount || 0;
  const totalCount = summary[0]?.count || 0;

  const paymentsGroupedByDate = byDate.map((row) => ({
    date: `${row._id.year}-${String(row._id.month).padStart(2, "0")}-${String(row._id.day).padStart(2, "0")}`,
    totalAmount: row.totalAmount,
    count: row.count,
  }));

  const paymentsGroupedByMethod = byMethod.map((row) => ({
    method: row._id,
    totalAmount: row.totalAmount,
    count: row.count,
  }));

  return {
    totalPaymentsReceived,
    paymentCount: totalCount,
    paymentsGroupedByMethod,
    paymentsGroupedByDate,
  };
};
