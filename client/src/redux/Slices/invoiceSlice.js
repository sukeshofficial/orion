// src/redux/Slices/invoiceSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as invService from "@/services/invoiceService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchInvoiceStats = createAsyncThunk(
  "invoice/fetchInvoiceStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await invService.fetchInvoices({ limit: 100 });
      const list = res.invoices || [];

      let draft = 0;
      let confirmed = 0;
      let paid = 0;
      let overdue = 0;
      let cancelled = 0;

      list.forEach((inv) => {
        const st = (inv.status || "").toLowerCase();
        if (st === "draft") draft++;
        else if (st === "confirmed") confirmed++;
        else if (st === "paid") paid++;
        else if (st === "overdue") overdue++;
        else if (st === "cancelled") cancelled++;
      });

      return {
        total: res.pagination?.total ?? list.length,
        draft,
        confirmed,
        paid,
        overdue,
        cancelled,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch invoice stats"
      );
    }
  }
);

export const fetchInvoices = createAsyncThunk(
  "invoice/fetchInvoices",
  async (params, { rejectWithValue }) => {
    try {
      return await invService.fetchInvoices(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch invoices"
      );
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  "invoice/fetchInvoiceById",
  async (id, { rejectWithValue }) => {
    if (!id || id === "create") {
      return rejectWithValue("Invalid invoice ID");
    }
    try {
      return await invService.fetchInvoiceById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch invoice"
      );
    }
  }
);

export const fetchInvoice = fetchInvoiceById;

export const createInvoice = createAsyncThunk(
  "invoice/createInvoice",
  async (payload, { rejectWithValue }) => {
    try {
      return await invService.createInvoice(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create invoice"
      );
    }
  }
);

export const generateInvoice = createInvoice;

export const confirmInvoice = createAsyncThunk(
  "invoice/confirmInvoice",
  async (id, { rejectWithValue }) => {
    try {
      return await invService.confirmInvoice(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to confirm invoice"
      );
    }
  }
);

export const cancelInvoice = createAsyncThunk(
  "invoice/cancelInvoice",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await invService.cancelInvoice(id, reason);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to cancel invoice"
      );
    }
  }
);

export const sendInvoice = createAsyncThunk(
  "invoice/sendInvoice",
  async ({ id, email }, { rejectWithValue }) => {
    try {
      return await invService.sendInvoice(id, email);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to send invoice"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  invoices: [],
  selectedInvoice: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  },
  stats: {
    total: 0,
    draft: 0,
    confirmed: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
  },
  filters: {
    search: "",
    status: "",
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const invoiceSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", status: "" };
    },
    clearSelectedInvoice(state) {
      state.selectedInvoice = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoiceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInvoiceById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedInvoice = action.payload.invoice || action.payload;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      .addCase(createInvoice.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.invoice) {
          state.invoices.unshift(action.payload.invoice);
        }
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(confirmInvoice.fulfilled, (state, action) => {
        const u = action.payload.invoice;
        if (u) {
          state.invoices = state.invoices.map((inv) =>
            (inv.id || inv._id) === (u.id || u._id) ? u : inv
          );
          if (state.selectedInvoice && (state.selectedInvoice.id || state.selectedInvoice._id) === (u.id || u._id)) {
            state.selectedInvoice = u;
          }
        }
      })
      .addCase(cancelInvoice.fulfilled, (state, action) => {
        const u = action.payload.invoice;
        if (u) {
          state.invoices = state.invoices.map((inv) =>
            (inv.id || inv._id) === (u.id || u._id) ? u : inv
          );
          if (state.selectedInvoice && (state.selectedInvoice.id || state.selectedInvoice._id) === (u.id || u._id)) {
            state.selectedInvoice = u;
          }
        }
      });
  },
});

export const { setFilters, clearFilters, clearSelectedInvoice, clearError } =
  invoiceSlice.actions;

export default invoiceSlice.reducer;

