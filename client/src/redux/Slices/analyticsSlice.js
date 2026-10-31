// src/redux/Slices/analyticsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as analyticsService from "@/services/analyticsService";

export const fetchAnalyticsOverview = createAsyncThunk(
  "analytics/fetchAnalyticsOverview",
  async (params, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchAnalyticsOverview(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch analytics overview");
    }
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  "analytics/fetchRevenueAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchRevenueAnalytics(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch revenue analytics");
    }
  }
);

export const fetchSubscriptionAnalytics = createAsyncThunk(
  "analytics/fetchSubscriptionAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchSubscriptionAnalytics(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch subscription analytics");
    }
  }
);

export const fetchInvoiceAnalytics = createAsyncThunk(
  "analytics/fetchInvoiceAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchInvoiceAnalytics(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch invoice analytics");
    }
  }
);

export const fetchPaymentAnalytics = createAsyncThunk(
  "analytics/fetchPaymentAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchPaymentAnalytics(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch payment analytics");
    }
  }
);

const initialState = {
  overview: {
    activeSubscriptions: 124,
    activeSubscriptionsGrowth: 12,
    revenueCollected: 124800000,
    revenueGrowth: 18,
    outstandingAmount: 32450000,
    outstandingDecrease: -8,
    overdueInvoices: 18,
    overdueDecrease: -5,
    upcomingRenewals: 27,
    renewalsGrowth: 20,
  },
  revenue: {
    granularity: "monthly",
    data: [],
  },
  subscriptions: {
    total: 124,
    byStatus: [],
    byPlan: [],
  },
  invoices: {
    total: 48,
    distribution: [],
  },
  payments: {
    totalPayments: 36,
    totalVolume: 48200000,
    byMethod: [],
  },
  filters: {
    period: "monthly",
    dateRange: "Oct 01, 2026 - Oct 31, 2026",
    customerId: "all",
    subscriptionStatus: "all",
    invoiceStatus: "all",
  },
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setAnalyticsFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetAnalyticsFilters(state) {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsOverview.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.revenue = action.payload;
      })
      .addCase(fetchSubscriptionAnalytics.fulfilled, (state, action) => {
        state.subscriptions = action.payload;
      })
      .addCase(fetchInvoiceAnalytics.fulfilled, (state, action) => {
        state.invoices = action.payload;
      })
      .addCase(fetchPaymentAnalytics.fulfilled, (state, action) => {
        state.payments = action.payload;
      });
  },
});

export const { setAnalyticsFilters, resetAnalyticsFilters } = analyticsSlice.actions;

export default analyticsSlice.reducer;

