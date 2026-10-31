// src/redux/Slices/quotationTemplateSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as templateService from "@/services/quotationTemplateService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchTemplateStats = createAsyncThunk(
  "quotationTemplate/fetchTemplateStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        templateService.fetchQuotationTemplates({ page: 1, limit: 100 }),
        templateService.fetchQuotationTemplates({ page: 1, limit: 1, isActive: true }),
        templateService.fetchQuotationTemplates({ page: 1, limit: 1, isActive: false }),
      ]);

      const allTemplates = allRes.templates || [];
      const planIdSet = new Set(
        allTemplates.map((t) => t.planId?.id || t.planId?._id || t.planId).filter(Boolean)
      );

      return {
        total: allRes.pagination?.total ?? 0,
        active: activeRes.pagination?.total ?? 0,
        inactive: inactiveRes.pagination?.total ?? 0,
        linkedPlans: planIdSet.size,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch template stats"
      );
    }
  }
);

export const fetchQuotationTemplates = createAsyncThunk(
  "quotationTemplate/fetchQuotationTemplates",
  async (params, { rejectWithValue }) => {
    try {
      return await templateService.fetchQuotationTemplates(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch templates"
      );
    }
  }
);

export const fetchQuotationTemplateById = createAsyncThunk(
  "quotationTemplate/fetchQuotationTemplateById",
  async (id, { rejectWithValue }) => {
    try {
      return await templateService.fetchQuotationTemplateById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch template"
      );
    }
  }
);

export const createQuotationTemplate = createAsyncThunk(
  "quotationTemplate/createQuotationTemplate",
  async (payload, { rejectWithValue }) => {
    try {
      return await templateService.createQuotationTemplate(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create template"
      );
    }
  }
);

export const updateQuotationTemplate = createAsyncThunk(
  "quotationTemplate/updateQuotationTemplate",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await templateService.updateQuotationTemplate(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update template"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  templates: [],
  selectedTemplate: null,
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
    linkedPlans: 0,
  },
  filters: {
    search: "",
    planId: "",
    isActive: "",
  },
  loading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const quotationTemplateSlice = createSlice({
  name: "quotationTemplate",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", planId: "", isActive: "" };
    },
    clearSelectedTemplate(state) {
      state.selectedTemplate = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTemplateStats
      .addCase(fetchTemplateStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // fetchQuotationTemplates
      .addCase(fetchQuotationTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotationTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload.templates || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchQuotationTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchQuotationTemplateById
      .addCase(fetchQuotationTemplateById.fulfilled, (state, action) => {
        state.selectedTemplate = action.payload.template || action.payload;
      })

      // createQuotationTemplate
      .addCase(createQuotationTemplate.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createQuotationTemplate.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.template) {
          state.templates.unshift(action.payload.template);
        }
      })
      .addCase(createQuotationTemplate.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updateQuotationTemplate
      .addCase(updateQuotationTemplate.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateQuotationTemplate.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.template;
        if (updated) {
          state.templates = state.templates.map((t) =>
            (t.id || t._id) === (updated.id || updated._id) ? updated : t
          );
        }
      })
      .addCase(updateQuotationTemplate.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedTemplate, clearError } =
  quotationTemplateSlice.actions;

export default quotationTemplateSlice.reducer;

