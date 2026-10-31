// src/redux/Slices/productSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as productService from "@/services/productService";

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchProductStats = createAsyncThunk(
  "product/fetchProductStats",
  async (_, { rejectWithValue }) => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        productService.fetchProducts({ page: 1, limit: 100 }),
        productService.fetchProducts({ page: 1, limit: 1, isActive: true }),
        productService.fetchProducts({ page: 1, limit: 1, isActive: false }),
      ]);

      const allProducts = allRes.products || [];
      const totalVariants = allProducts.reduce(
        (sum, p) => sum + (Array.isArray(p.variants) ? p.variants.length : 0),
        0
      );

      return {
        total: allRes.pagination?.total ?? 0,
        active: activeRes.pagination?.total ?? 0,
        inactive: inactiveRes.pagination?.total ?? 0,
        totalVariants,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch product stats"
      );
    }
  }
);

export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (params, { rejectWithValue }) => {
    try {
      return await productService.fetchProducts(params);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch products"
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "product/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      return await productService.fetchProductById(id);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to fetch product"
      );
    }
  }
);

export const createProduct = createAsyncThunk(
  "product/createProduct",
  async (payload, { rejectWithValue }) => {
    try {
      return await productService.createProduct(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create product"
      );
    }
  }
);

export const updateProduct = createAsyncThunk(
  "product/updateProduct",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await productService.updateProduct(id, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update product"
      );
    }
  }
);

export const updateProductStatus = createAsyncThunk(
  "product/updateProductStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      return await productService.updateProductStatus(id, isActive);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to update product status"
      );
    }
  }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  products: [],
  selectedProduct: null,
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
    totalVariants: 0,
  },
  filters: {
    search: "",
    type: "",
    isActive: "",
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { search: "", type: "", isActive: "" };
    },
    clearSelectedProduct(state) {
      state.selectedProduct = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProductStats
      .addCase(fetchProductStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedProduct = action.payload.product || action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // createProduct
      .addCase(createProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.product) {
          state.products.unshift(action.payload.product);
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updateProduct
      .addCase(updateProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.product;
        if (updated) {
          state.products = state.products.map((p) =>
            (p.id || p._id) === (updated.id || updated._id) ? updated : p
          );
          if (state.selectedProduct && (state.selectedProduct.id || state.selectedProduct._id) === (updated.id || updated._id)) {
            state.selectedProduct = updated;
          }
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updateProductStatus
      .addCase(updateProductStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateProductStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.product;
        if (updated) {
          state.products = state.products.map((p) =>
            (p.id || p._id) === (updated.id || updated._id) ? updated : p
          );
        }
      })
      .addCase(updateProductStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedProduct, clearError } =
  productSlice.actions;

export default productSlice.reducer;

