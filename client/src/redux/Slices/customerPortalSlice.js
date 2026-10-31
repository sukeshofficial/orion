// src/redux/Slices/customerPortalSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as portalService from "@/services/customerPortalService";

export const fetchPortalOverview = createAsyncThunk(
  "portal/fetchPortalOverview",
  async (_, { rejectWithValue }) => {
    try {
      return await portalService.fetchPortalOverview();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch portal overview");
    }
  }
);

export const fetchPortalProfile = createAsyncThunk(
  "portal/fetchPortalProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await portalService.fetchPortalProfile();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch portal profile");
    }
  }
);

export const updatePortalProfile = createAsyncThunk(
  "portal/updatePortalProfile",
  async (payload, { rejectWithValue }) => {
    try {
      return await portalService.updatePortalProfile(payload);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update profile");
    }
  }
);

export const changePassword = createAsyncThunk(
  "portal/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await portalService.changePassword(payload);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to change password");
    }
  }
);

const initialState = {
  overview: {
    activeSubscriptions: 2,
    activeSubscriptionsGrowth: 1,
    upcomingRenewals: 1,
    upcomingRenewalsDate: "Nov 01, 2026",
    outstandingInvoices: 6000000,
    outstandingCount: 2,
    recentPayments: 12000000,
    lastPaymentDate: "Oct 20, 2026",
  },
  profile: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const customerPortalSlice = createSlice({
  name: "portal",
  initialState,
  reducers: {
    clearPortalError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortalOverview.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPortalOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchPortalOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPortalProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updatePortalProfile.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updatePortalProfile.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.user) {
          state.profile = { ...state.profile, ...action.payload.user };
        }
      })
      .addCase(updatePortalProfile.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPortalError } = customerPortalSlice.actions;

export default customerPortalSlice.reducer;

