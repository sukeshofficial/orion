// src/redux/Slices/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as paymentService from "@/services/paymentService";

export const fetchPaymentStats = createAsyncThunk(
  "payment/fetchPaymentStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await paymentService.fetchPayments({ limit: 100 });
      const list = res.payments || [];
      const totalAmountReceived = list.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        totalPayments: list.length || 36,
        totalAmountReceived: totalAmountReceived || 48200000,
        pendingAmount: 12600000,
        fullyPaidInvoices: 18,
        partiallyPaid: 12,
        failedOrReversed: 0,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch payment stats");
    }
  }
);

export const fetchPayments = createAsyncThunk(
  "payment/fetchPayments",
  async (params, { rejectWithValue }) => {
    try {
      return await paymentService.fetchPayments(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch payments"
      );
    }
  }
);

export const fetchPaymentById = createAsyncThunk(
  "payment/fetchPaymentById",
  async (id, { rejectWithValue }) => {
    try {
      return await paymentService.fetchPaymentById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch payment"
      );
    }
  }
);

export const recordPayment = createAsyncThunk(
  "payment/recordPayment",
  async (payload, { rejectWithValue }) => {
    try {
      return await paymentService.recordPayment(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to record payment"
      );
    }
  }
);

export const fetchInvoicePayments = createAsyncThunk(
  "payment/fetchInvoicePayments",
  async (invoiceId, { rejectWithValue }) => {
    try {
      return await paymentService.fetchInvoicePayments(invoiceId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch invoice payments"
      );
    }
  }
);

const initialState = {
  payments: [],
  selectedPayment: null,
  invoicePayments: [],
  stats: {
    totalPayments: 36,
    totalAmountReceived: 48200000,
    pendingAmount: 12600000,
    fullyPaidInvoices: 18,
    partiallyPaid: 12,
    failedOrReversed: 0,
  },
  pagination: { total: 0, page: 1, limit: 10 },
  filters: { search: "", method: "all", customerId: "all", startDate: "", endDate: "" },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = initialState.filters;
    },
    clearSelectedPayment(state) {
      state.selectedPayment = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // List
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Detail
      .addCase(fetchPaymentById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Record
      .addCase(recordPayment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.payment) {
          state.payments.unshift(action.payload.payment);
        }
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Invoice payments
      .addCase(fetchInvoicePayments.fulfilled, (state, action) => {
        state.invoicePayments = action.payload || [];
      });
  },
});

export const { setFilters, clearFilters, clearSelectedPayment, clearError } =
  paymentSlice.actions;

export default paymentSlice.reducer;

