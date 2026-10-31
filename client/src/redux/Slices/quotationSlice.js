// src/redux/Slices/quotationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as quotationService from "@/services/quotationService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchQuotationStats = createAsyncThunk(
  "quotation/fetchQuotationStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, draftRes, sentRes, confirmedRes] = await Promise.all([
        quotationService.fetchQuotations({ page: 1, limit: 1 }),
        quotationService.fetchQuotations({ page: 1, limit: 1, status: "Draft" }),
        quotationService.fetchQuotations({ page: 1, limit: 1, status: "Quotation" }),
        quotationService.fetchQuotations({ page: 1, limit: 1, status: "Confirmed" }),
      ]);

      return {
        total: allRes.pagination?.total ?? 0,
        draft: draftRes.pagination?.total ?? 0,
        sent: sentRes.pagination?.total ?? 0,
        accepted: confirmedRes.pagination?.total ?? 0,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch quotation stats"
      );
    }
  }
);

export const fetchQuotations = createAsyncThunk(
  "quotation/fetchQuotations",
  async (params, { rejectWithValue }) => {
    try {
      return await quotationService.fetchQuotations(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch quotations"
      );
    }
  }
);

export const fetchQuotationById = createAsyncThunk(
  "quotation/fetchQuotationById",
  async (id, { rejectWithValue }) => {
    try {
      return await quotationService.fetchQuotationById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch quotation"
      );
    }
  }
);

export const createQuotation = createAsyncThunk(
  "quotation/createQuotation",
  async (payload, { rejectWithValue }) => {
    try {
      return await quotationService.createQuotation(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create quotation"
      );
    }
  }
);

export const updateQuotation = createAsyncThunk(
  "quotation/updateQuotation",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await quotationService.updateQuotation(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update quotation"
      );
    }
  }
);

export const confirmQuotation = createAsyncThunk(
  "quotation/confirmQuotation",
  async (id, { rejectWithValue }) => {
    try {
      return await quotationService.confirmQuotation(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to confirm quotation"
      );
    }
  }
);

export const cancelQuotation = createAsyncThunk(
  "quotation/cancelQuotation",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await quotationService.cancelQuotation(id, reason);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to cancel quotation"
      );
    }
  }
);

export const convertQuotation = createAsyncThunk(
  "quotation/convertQuotation",
  async (id, { rejectWithValue }) => {
    try {
      return await quotationService.convertQuotationToSubscription(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to convert quotation"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  quotations: [],
  selectedQuotation: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  },
  stats: {
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
  },
  filters: {
    search: "",
    status: "",
    customerId: "",
    planId: "",
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const quotationSlice = createSlice({
  name: "quotation",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", status: "", customerId: "", planId: "" };
    },
    clearSelectedQuotation(state) {
      state.selectedQuotation = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchQuotationStats
      .addCase(fetchQuotationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // fetchQuotations
      .addCase(fetchQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload.quotations || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchQuotationById
      .addCase(fetchQuotationById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchQuotationById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedQuotation = action.payload.quotation || action.payload;
      })
      .addCase(fetchQuotationById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // createQuotation
      .addCase(createQuotation.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createQuotation.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.quotation) {
          state.quotations.unshift(action.payload.quotation);
        }
      })
      .addCase(createQuotation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updateQuotation
      .addCase(updateQuotation.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateQuotation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.quotation;
        if (updated) {
          state.quotations = state.quotations.map((q) =>
            (q.id || q._id) === (updated.id || updated._id) ? updated : q
          );
          if (state.selectedQuotation && (state.selectedQuotation.id || state.selectedQuotation._id) === (updated.id || updated._id)) {
            state.selectedQuotation = updated;
          }
        }
      })
      .addCase(updateQuotation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // confirmQuotation
      .addCase(confirmQuotation.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(confirmQuotation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.quotation;
        if (updated) {
          state.quotations = state.quotations.map((q) =>
            (q.id || q._id) === (updated.id || updated._id) ? updated : q
          );
          if (state.selectedQuotation && (state.selectedQuotation.id || state.selectedQuotation._id) === (updated.id || updated._id)) {
            state.selectedQuotation = updated;
          }
        }
      })
      .addCase(confirmQuotation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // cancelQuotation
      .addCase(cancelQuotation.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(cancelQuotation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.quotation;
        if (updated) {
          state.quotations = state.quotations.map((q) =>
            (q.id || q._id) === (updated.id || updated._id) ? updated : q
          );
          if (state.selectedQuotation && (state.selectedQuotation.id || state.selectedQuotation._id) === (updated.id || updated._id)) {
            state.selectedQuotation = updated;
          }
        }
      })
      .addCase(cancelQuotation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // convertQuotation
      .addCase(convertQuotation.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(convertQuotation.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(convertQuotation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedQuotation, clearError } =
  quotationSlice.actions;

export default quotationSlice.reducer;

