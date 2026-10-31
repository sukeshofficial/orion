// src/redux/Slices/discountSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as discService from "@/services/discountService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchDiscountStats = createAsyncThunk(
  "discount/fetchDiscountStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        discService.fetchDiscounts({ page: 1, limit: 1 }),
        discService.fetchDiscounts({ page: 1, limit: 1, isActive: true }),
        discService.fetchDiscounts({ page: 1, limit: 1, isActive: false }),
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

export const fetchDiscounts = createAsyncThunk(
  "discount/fetchDiscounts",
  async (params, { rejectWithValue }) => {
    try {
      return await discService.fetchDiscounts(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch discounts"
      );
    }
  }
);

export const fetchDiscountById = createAsyncThunk(
  "discount/fetchDiscountById",
  async (id, { rejectWithValue }) => {
    try {
      return await discService.fetchDiscountById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch discount"
      );
    }
  }
);

export const fetchDiscount = fetchDiscountById;

export const createDiscount = createAsyncThunk(
  "discount/createDiscount",
  async (payload, { rejectWithValue }) => {
    try {
      return await discService.createDiscount(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create discount"
      );
    }
  }
);

export const updateDiscount = createAsyncThunk(
  "discount/updateDiscount",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await discService.updateDiscount(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update discount"
      );
    }
  }
);

export const updateDiscountStatus = createAsyncThunk(
  "discount/updateDiscountStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      return await discService.updateDiscountStatus(id, isActive);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update discount status"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  discounts: [],
  selectedDiscount: null,
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
    type: "",
    appliesTo: "",
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const discountSlice = createSlice({
  name: "discount",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", isActive: "", type: "", appliesTo: "" };
    },
    clearSelectedDiscount(state) {
      state.selectedDiscount = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscountStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = action.payload.discounts || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDiscountById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchDiscountById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedDiscount = action.payload.discount || action.payload;
      })
      .addCase(fetchDiscountById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      .addCase(createDiscount.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createDiscount.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.discount) {
          state.discounts.unshift(action.payload.discount);
        }
      })
      .addCase(createDiscount.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateDiscount.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateDiscount.fulfilled, (state, action) => {
        state.actionLoading = false;
        const u = action.payload.discount;
        if (u) {
          state.discounts = state.discounts.map((d) =>
            (d.id || d._id) === (u.id || u._id) ? u : d
          );
          if (state.selectedDiscount && (state.selectedDiscount.id || state.selectedDiscount._id) === (u.id || u._id)) {
            state.selectedDiscount = u;
          }
        }
      })
      .addCase(updateDiscount.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateDiscountStatus.fulfilled, (state, action) => {
        const u = action.payload.discount;
        if (u) {
          state.discounts = state.discounts.map((d) =>
            (d.id || d._id) === (u.id || u._id) ? u : d
          );
          if (state.selectedDiscount && (state.selectedDiscount.id || state.selectedDiscount._id) === (u.id || u._id)) {
            state.selectedDiscount = u;
          }
        }
      });
  },
});

export const { setFilters, clearFilters, clearSelectedDiscount, clearError } =
  discountSlice.actions;

export default discountSlice.reducer;

