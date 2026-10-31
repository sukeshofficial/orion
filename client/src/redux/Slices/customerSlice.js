// src/redux/Slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as customerService from "@/services/customerService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

/**
 * Fetch summary stats (total / active / inactive) with limit=1 to keep
 * payloads tiny — only pagination.total is needed from each response.
 */
export const fetchCustomerStats = createAsyncThunk(
  "customer/fetchCustomerStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        customerService.fetchCustomers({ page: 1, limit: 1 }),
        customerService.fetchCustomers({ page: 1, limit: 1, status: "active" }),
        customerService.fetchCustomers({ page: 1, limit: 1, status: "inactive" }),
      ]);
      return {
        total: allRes.pagination?.total ?? 0,
        active: activeRes.pagination?.total ?? 0,
        inactive: inactiveRes.pagination?.total ?? 0,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch stats"
      );
    }
  }
);

export const fetchCustomers = createAsyncThunk(
  "customer/fetchCustomers",
  async (params, { rejectWithValue }) => {
    try {
      return await customerService.fetchCustomers(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch customers"
      );
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customer/createCustomer",
  async (payload, { rejectWithValue }) => {
    try {
      return await customerService.createCustomer(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create customer"
      );
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  "customer/fetchCustomerById",
  async (id, { rejectWithValue }) => {
    try {
      return await customerService.fetchCustomerById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch customer"
      );
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customer/updateCustomer",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await customerService.updateCustomer(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update customer"
      );
    }
  }
);

export const fetchCustomerSubscriptions = createAsyncThunk(
  "customer/fetchCustomerSubscriptions",
  async (id, { rejectWithValue }) => {
    try {
      return await customerService.fetchCustomerSubscriptions(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch subscriptions"
      );
    }
  }
);

export const fetchCustomerInvoices = createAsyncThunk(
  "customer/fetchCustomerInvoices",
  async (id, { rejectWithValue }) => {
    try {
      return await customerService.fetchCustomerInvoices(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch invoices"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  customers: [],
  selectedCustomer: null,
  subscriptions: [],
  invoices: [],
  loading: false,        // list / create / update
  detailLoading: false,  // fetchCustomerById
  relatedLoading: false, // subscriptions / invoices
  error: null,
  pagination: {
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    status: "",
  },
  // Cumulative stats fetched separately (no filter) for summary cards
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    newLast30: 0,
    statsLoaded: false,
  },
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
      state.subscriptions = [];
      state.invoices = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchCustomerStats ─────────────────────────────────────────────────────
    builder
      .addCase(fetchCustomerStats.fulfilled, (state, action) => {
        state.stats = {
          total: action.payload.total,
          active: action.payload.active,
          inactive: action.payload.inactive,
          loaded: true,
        };
      });

    // ── fetchCustomers ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.customers ?? [];
        if (action.payload.pagination) {
          state.pagination = {
            page: action.payload.pagination.page ?? 1,
            limit: action.payload.pagination.limit ?? 8,
            total: action.payload.pagination.total ?? 0,
            totalPages: action.payload.pagination.totalPages ?? 0,
          };
        }
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── createCustomer ─────────────────────────────────────────────────────────
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.customer) {
          state.customers.unshift(action.payload.customer);
          state.pagination.total += 1;
          // Keep stats in sync
          state.stats.total += 1;
          if (action.payload.customer.isActive !== false) state.stats.active += 1;
          else state.stats.inactive += 1;
        }
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── fetchCustomerById ──────────────────────────────────────────────────────
    builder
      .addCase(fetchCustomerById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedCustomer = action.payload.customer ?? null;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      });

    // ── updateCustomer ─────────────────────────────────────────────────────────
    builder
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.customer;
        if (updated) {
          // Update in list
          const idx = state.customers.findIndex((c) => c.id === updated.id);
          if (idx !== -1) state.customers[idx] = updated;
          // Update detail view
          if (state.selectedCustomer?.id === updated.id) {
            state.selectedCustomer = updated;
          }
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── fetchCustomerSubscriptions ─────────────────────────────────────────────
    builder
      .addCase(fetchCustomerSubscriptions.pending, (state) => {
        state.relatedLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomerSubscriptions.fulfilled, (state, action) => {
        state.relatedLoading = false;
        state.subscriptions = action.payload.subscriptions ?? action.payload.data ?? [];
      })
      .addCase(fetchCustomerSubscriptions.rejected, (state, action) => {
        state.relatedLoading = false;
        state.error = action.payload;
      });

    // ── fetchCustomerInvoices ──────────────────────────────────────────────────
    builder
      .addCase(fetchCustomerInvoices.pending, (state) => {
        state.relatedLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomerInvoices.fulfilled, (state, action) => {
        state.relatedLoading = false;
        state.invoices = action.payload.invoices ?? action.payload.data ?? [];
      })
      .addCase(fetchCustomerInvoices.rejected, (state, action) => {
        state.relatedLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearSelectedCustomer, clearError } = customerSlice.actions;
export default customerSlice.reducer;

