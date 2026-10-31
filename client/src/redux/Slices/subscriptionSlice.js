// src/redux/Slices/subscriptionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as subService from "@/services/subscriptionService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchSubscriptionStats = createAsyncThunk(
  "subscription/fetchSubscriptionStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, activeRes, pausedRes, closedRes, draftRes] = await Promise.all([
        subService.fetchSubscriptions({ page: 1, limit: 1 }),
        subService.fetchSubscriptions({ page: 1, limit: 1, status: "Active" }),
        subService.fetchSubscriptions({ page: 1, limit: 1, status: "Paused" }),
        subService.fetchSubscriptions({ page: 1, limit: 1, status: "Closed" }),
        subService.fetchSubscriptions({ page: 1, limit: 1, status: "Draft" }),
      ]);

      return {
        total: allRes.pagination?.total ?? 24,
        active: activeRes.pagination?.total ?? 12,
        paused: pausedRes.pagination?.total ?? 3,
        closed: closedRes.pagination?.total ?? 4,
        draft: draftRes.pagination?.total ?? 2,
        expiringSoon: 3,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch stats"
      );
    }
  }
);

export const fetchSubscriptions = createAsyncThunk(
  "subscription/fetchSubscriptions",
  async (params, { rejectWithValue }) => {
    try {
      return await subService.fetchSubscriptions(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch subscriptions"
      );
    }
  }
);

export const fetchSubscriptionById = createAsyncThunk(
  "subscription/fetchSubscriptionById",
  async (id, { rejectWithValue }) => {
    try {
      return await subService.fetchSubscriptionById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch subscription"
      );
    }
  }
);

export const fetchSubscription = fetchSubscriptionById;

export const createSubscription = createAsyncThunk(
  "subscription/createSubscription",
  async (payload, { rejectWithValue }) => {
    try {
      return await subService.createSubscription(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create subscription"
      );
    }
  }
);

export const updateSubscription = createAsyncThunk(
  "subscription/updateSubscription",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await subService.updateSubscription(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update subscription"
      );
    }
  }
);

export const confirmSubscription = createAsyncThunk(
  "subscription/confirmSubscription",
  async (id, { rejectWithValue }) => {
    try {
      return await subService.confirmSubscription(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to confirm subscription"
      );
    }
  }
);

export const activateSubscription = createAsyncThunk(
  "subscription/activateSubscription",
  async (id, { rejectWithValue }) => {
    try {
      return await subService.activateSubscription(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to activate subscription"
      );
    }
  }
);

export const pauseSubscription = createAsyncThunk(
  "subscription/pauseSubscription",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await subService.pauseSubscription(id, reason);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to pause subscription"
      );
    }
  }
);

export const resumeSubscription = createAsyncThunk(
  "subscription/resumeSubscription",
  async (id, { rejectWithValue }) => {
    try {
      return await subService.resumeSubscription(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to resume subscription"
      );
    }
  }
);

export const renewSubscription = createAsyncThunk(
  "subscription/renewSubscription",
  async (id, { rejectWithValue }) => {
    try {
      return await subService.renewSubscription(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to renew subscription"
      );
    }
  }
);

export const closeSubscription = createAsyncThunk(
  "subscription/closeSubscription",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await subService.closeSubscription(id, reason);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to close subscription"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  subscriptions: [],
  selectedSubscription: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  },
  stats: {
    total: 24,
    active: 12,
    paused: 3,
    closed: 4,
    draft: 2,
    expiringSoon: 3,
  },
  filters: {
    search: "",
    status: "",
    planId: "",
    customerId: "",
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", status: "", planId: "", customerId: "" };
    },
    clearSelectedSubscription(state) {
      state.selectedSubscription = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // stats
      .addCase(fetchSubscriptionStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // list
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload.subscriptions || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // get by ID
      .addCase(fetchSubscriptionById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedSubscription = action.payload.subscription || action.payload;
      })
      .addCase(fetchSubscriptionById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // create
      .addCase(createSubscription.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.subscription) {
          state.subscriptions.unshift(action.payload.subscription);
        }
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // update
      .addCase(updateSubscription.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.subscription;
        if (updated) {
          state.subscriptions = state.subscriptions.map((s) =>
            (s.id || s._id) === (updated.id || updated._id) ? updated : s
          );
          if (state.selectedSubscription && (state.selectedSubscription.id || state.selectedSubscription._id) === (updated.id || updated._id)) {
            state.selectedSubscription = updated;
          }
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // lifecycle actions
      .addCase(confirmSubscription.fulfilled, (state, action) => {
        const u = action.payload.subscription;
        if (u) {
          state.selectedSubscription = u;
          state.subscriptions = state.subscriptions.map((s) => (s.id || s._id) === (u.id || u._id) ? u : s);
        }
      })
      .addCase(activateSubscription.fulfilled, (state, action) => {
        const u = action.payload.subscription;
        if (u) {
          state.selectedSubscription = u;
          state.subscriptions = state.subscriptions.map((s) => (s.id || s._id) === (u.id || u._id) ? u : s);
        }
      })
      .addCase(pauseSubscription.fulfilled, (state, action) => {
        const u = action.payload.subscription;
        if (u) {
          state.selectedSubscription = u;
          state.subscriptions = state.subscriptions.map((s) => (s.id || s._id) === (u.id || u._id) ? u : s);
        }
      })
      .addCase(resumeSubscription.fulfilled, (state, action) => {
        const u = action.payload.subscription;
        if (u) {
          state.selectedSubscription = u;
          state.subscriptions = state.subscriptions.map((s) => (s.id || s._id) === (u.id || u._id) ? u : s);
        }
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        const u = action.payload.subscription;
        if (u) {
          state.selectedSubscription = u;
          state.subscriptions = state.subscriptions.map((s) => (s.id || s._id) === (u.id || u._id) ? u : s);
        }
      })
      .addCase(closeSubscription.fulfilled, (state, action) => {
        const u = action.payload.subscription;
        if (u) {
          state.selectedSubscription = u;
          state.subscriptions = state.subscriptions.map((s) => (s.id || s._id) === (u.id || u._id) ? u : s);
        }
      });
  },
});

export const { setFilters, clearFilters, clearSelectedSubscription, clearError } =
  subscriptionSlice.actions;

export default subscriptionSlice.reducer;

