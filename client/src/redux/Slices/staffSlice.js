// src/redux/Slices/staffSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as staffService from "@/services/staffService";

export const fetchStaffList = createAsyncThunk(
  "staff/fetchStaffList",
  async (params, { rejectWithValue }) => {
    try {
      return await staffService.fetchStaffList(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch staff members"
      );
    }
  }
);

export const fetchStaffById = createAsyncThunk(
  "staff/fetchStaffById",
  async (id, { rejectWithValue }) => {
    try {
      return await staffService.fetchStaffById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch staff member"
      );
    }
  }
);

export const createStaff = createAsyncThunk(
  "staff/createStaff",
  async (payload, { rejectWithValue }) => {
    try {
      return await staffService.createStaff(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to add staff member"
      );
    }
  }
);

export const updateStaff = createAsyncThunk(
  "staff/updateStaff",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await staffService.updateStaff(id, updates);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update staff member"
      );
    }
  }
);

export const updateStaffStatus = createAsyncThunk(
  "staff/updateStaffStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await staffService.updateStaffStatus(id, status);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update staff status"
      );
    }
  }
);

export const fetchPermissionCatalog = createAsyncThunk(
  "staff/fetchPermissionCatalog",
  async (_, { rejectWithValue }) => {
    try {
      return await staffService.fetchPermissionCatalog();
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch permission catalog"
      );
    }
  }
);

const initialState = {
  staffList: [],
  selectedStaff: null,
  permissionCatalog: [],
  stats: {
    total: 0,
    active: 0,
    disabled: 0,
    operationalSeats: 0,
  },
  pagination: { total: 0, page: 1, limit: 10 },
  filters: { search: "", status: "all", permission: "all" },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    setStaffFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearStaffFilters(state) {
      state.filters = initialState.filters;
    },
    clearSelectedStaff(state) {
      state.selectedStaff = null;
    },
    clearStaffError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchStaffList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffList.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList = action.payload.staff || [];
        state.pagination = action.payload.pagination || state.pagination;
        // update quick stats
        const activeCount = state.staffList.filter(
          (s) => (s.status || "").toLowerCase() === "active"
        ).length;
        state.stats = {
          total: state.staffList.length,
          active: activeCount,
          disabled: state.staffList.length - activeCount,
          operationalSeats: Math.max(state.staffList.length, 5),
        };
      })
      .addCase(fetchStaffList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch By ID
      .addCase(fetchStaffById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedStaff = action.payload;
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Create Staff
      .addCase(createStaff.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.staff) {
          state.staffList.unshift(action.payload.staff);
        }
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Update Staff
      .addCase(updateStaff.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.staff) {
          const u = action.payload.staff;
          const idx = state.staffList.findIndex((s) => (s._id || s.id) === (u._id || u.id));
          if (idx !== -1) state.staffList[idx] = u;
          if (state.selectedStaff && (state.selectedStaff._id || state.selectedStaff.id) === (u._id || u.id)) {
            state.selectedStaff = u;
          }
        }
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Update Status
      .addCase(updateStaffStatus.fulfilled, (state, action) => {
        if (action.payload.staff) {
          const u = action.payload.staff;
          const idx = state.staffList.findIndex((s) => (s._id || s.id) === (u._id || u.id));
          if (idx !== -1) state.staffList[idx] = u;
        }
      })
      // Permission catalog
      .addCase(fetchPermissionCatalog.fulfilled, (state, action) => {
        state.permissionCatalog = action.payload.permissions || [];
      });
  },
});

export const { setStaffFilters, clearStaffFilters, clearSelectedStaff, clearStaffError } =
  staffSlice.actions;

export default staffSlice.reducer;

