// src/redux/Slices/taxSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as taxService from "@/services/taxService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchTaxStats = createAsyncThunk(
  "tax/fetchTaxStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        taxService.fetchTaxes({ page: 1, limit: 1 }),
        taxService.fetchTaxes({ page: 1, limit: 1, isActive: true }),
        taxService.fetchTaxes({ page: 1, limit: 1, isActive: false }),
      ]);
      return {
        total: allRes.pagination?.total ?? 0,
        active: activeRes.pagination?.total ?? 0,
        inactive: inactiveRes.pagination?.total ?? 0,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch tax stats"
      );
    }
  }
);

export const fetchTaxes = createAsyncThunk(
  "tax/fetchTaxes",
  async (params, { rejectWithValue }) => {
    try {
      return await taxService.fetchTaxes(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch taxes"
      );
    }
  }
);

export const fetchTaxById = createAsyncThunk(
  "tax/fetchTaxById",
  async (id, { rejectWithValue }) => {
    try {
      return await taxService.fetchTaxById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch tax"
      );
    }
  }
);

export const createTax = createAsyncThunk(
  "tax/createTax",
  async (payload, { rejectWithValue }) => {
    try {
      return await taxService.createTax(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create tax"
      );
    }
  }
);

export const updateTax = createAsyncThunk(
  "tax/updateTax",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await taxService.updateTax(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update tax"
      );
    }
  }
);

export const updateTaxStatus = createAsyncThunk(
  "tax/updateTaxStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      return await taxService.updateTaxStatus(id, isActive);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update tax status"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  taxes: [],
  selectedTax: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  },
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
  },
  filters: {
    search: "",
    isActive: "",
  },
  loading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const taxSlice = createSlice({
  name: "tax",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", isActive: "" };
    },
    clearSelectedTax(state) {
      state.selectedTax = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTaxStats
      .addCase(fetchTaxStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // fetchTaxes
      .addCase(fetchTaxes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxes.fulfilled, (state, action) => {
        state.loading = false;
        state.taxes = action.payload.taxes || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchTaxes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchTaxById
      .addCase(fetchTaxById.fulfilled, (state, action) => {
        state.selectedTax = action.payload.tax || action.payload;
      })

      // createTax
      .addCase(createTax.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createTax.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.tax) {
          state.taxes.unshift(action.payload.tax);
        }
      })
      .addCase(createTax.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updateTax
      .addCase(updateTax.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateTax.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.tax;
        if (updated) {
          state.taxes = state.taxes.map((t) =>
            (t.id || t._id) === (updated.id || updated._id) ? updated : t
          );
        }
      })
      .addCase(updateTax.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updateTaxStatus
      .addCase(updateTaxStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTaxStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.tax;
        if (updated) {
          state.taxes = state.taxes.map((t) =>
            (t.id || t._id) === (updated.id || updated._id) ? updated : t
          );
        }
      })
      .addCase(updateTaxStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedTax, clearError } = taxSlice.actions;

export default taxSlice.reducer;

