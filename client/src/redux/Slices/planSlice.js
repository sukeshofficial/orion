// src/redux/Slices/planSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as planService from "@/services/planService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchPlanStats = createAsyncThunk(
  "plan/fetchPlanStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        planService.fetchPlans({ page: 1, limit: 100 }),
        planService.fetchPlans({ page: 1, limit: 1, isActive: true }),
        planService.fetchPlans({ page: 1, limit: 1, isActive: false }),
      ]);

      const allPlans = allRes.plans || [];
      const now = new Date();
      const availablePlans = allPlans.filter((p) => {
        if (!p.isActive) return false;
        if (p.availableFrom && new Date(p.availableFrom) > now) return false;
        if (p.availableUntil && new Date(p.availableUntil) < now) return false;
        return true;
      }).length;

      return {
        total: allRes.pagination?.total ?? 0,
        active: activeRes.pagination?.total ?? 0,
        inactive: inactiveRes.pagination?.total ?? 0,
        available: availablePlans,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch plan stats"
      );
    }
  }
);

export const fetchPlans = createAsyncThunk(
  "plan/fetchPlans",
  async (params, { rejectWithValue }) => {
    try {
      return await planService.fetchPlans(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch plans"
      );
    }
  }
);

export const fetchPlanById = createAsyncThunk(
  "plan/fetchPlanById",
  async (id, { rejectWithValue }) => {
    try {
      return await planService.fetchPlanById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch plan"
      );
    }
  }
);

export const createPlan = createAsyncThunk(
  "plan/createPlan",
  async (payload, { rejectWithValue }) => {
    try {
      return await planService.createPlan(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create plan"
      );
    }
  }
);

export const updatePlan = createAsyncThunk(
  "plan/updatePlan",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await planService.updatePlan(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update plan"
      );
    }
  }
);

export const updatePlanStatus = createAsyncThunk(
  "plan/updatePlanStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      return await planService.updatePlanStatus(id, isActive);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update plan status"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  plans: [],
  selectedPlan: null,
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
    available: 0,
  },
  filters: {
    search: "",
    billingInterval: "",
    isActive: "",
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const planSlice = createSlice({
  name: "plan",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", billingInterval: "", isActive: "" };
    },
    clearSelectedPlan(state) {
      state.selectedPlan = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPlanStats
      .addCase(fetchPlanStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // fetchPlans
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload.plans || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchPlanById
      .addCase(fetchPlanById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPlanById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedPlan = action.payload.plan || action.payload;
      })
      .addCase(fetchPlanById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // createPlan
      .addCase(createPlan.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.plan) {
          state.plans.unshift(action.payload.plan);
        }
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updatePlan
      .addCase(updatePlan.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updatePlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.plan;
        if (updated) {
          state.plans = state.plans.map((p) =>
            (p.id || p._id) === (updated.id || updated._id) ? updated : p
          );
          if (state.selectedPlan && (state.selectedPlan.id || state.selectedPlan._id) === (updated.id || updated._id)) {
            state.selectedPlan = updated;
          }
        }
      })
      .addCase(updatePlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updatePlanStatus
      .addCase(updatePlanStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updatePlanStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.plan;
        if (updated) {
          state.plans = state.plans.map((p) =>
            (p.id || p._id) === (updated.id || updated._id) ? updated : p
          );
        }
      })
      .addCase(updatePlanStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedPlan, clearError } = planSlice.actions;

export default planSlice.reducer;

