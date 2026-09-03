import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/axios";
import type {
  ListParams,
  Meta,
  Paginated,
  Product,
  ProductPayload,
  ProductUpdatePayload,
} from "@/types";

interface ProductsState {
  items: Product[];
  meta: Meta | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  selected: Product | null;
  selectedLoading: boolean;
  selectedError: string | null;
  updating: boolean;
  updateError: string | null;
  deleting: boolean;
  deleteError: string | null;
}

const initialState: ProductsState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  creating: false,
  createError: null,
  selected: null,
  selectedLoading: false,
  selectedError: null,
  updating: false,
  updateError: null,
  deleting: false,
  deleteError: null,
};

export const fetchProducts = createAsyncThunk<
  Paginated<Product>,
  ListParams | void,
  { rejectValue: string }
>("products/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Paginated<Product>>("/products", {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 20 },
    });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load products."));
  }
});

export const fetchProductById = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>("products/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load product."));
  }
});

export const createProduct = createAsyncThunk<
  Product,
  ProductPayload,
  { rejectValue: string }
>("products/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<Product>("/products", payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not create product."));
  }
});

/** Only name and description are editable; requires ADMIN on the server. */
export const updateProduct = createAsyncThunk<
  Product,
  { id: string; payload: ProductUpdatePayload },
  { rejectValue: string }
>("products/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<Product>(`/products/${id}`, payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not update product."));
  }
});

/** Soft delete: the API deactivates the product rather than removing it. */
export const deleteProduct = createAsyncThunk<
  { id: string; product: Product | null },
  string,
  { rejectValue: string }
>("products/delete", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete<Product | null>(`/products/${id}`);
    // A 204 leaves no body, so fall back to flipping isActive locally.
    return { id, product: data && data.id ? data : null };
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not deactivate product."),
    );
  }
});

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProductFormErrors(state) {
      state.createError = null;
      state.updateError = null;
    },
    clearSelectedProduct(state) {
      state.selected = null;
      state.selectedError = null;
      state.updateError = null;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Could not load products.";
      })

      .addCase(fetchProductById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload ?? "Could not load product.";
      })

      .addCase(createProduct.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload ?? "Could not create product.";
      })

      .addCase(updateProduct.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.updating = false;
        state.selected = action.payload;
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload ?? "Could not update product.";
      })

      .addCase(deleteProduct.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        const { id, product } = action.payload;
        state.deleting = false;

        if (state.selected?.id === id) {
          state.selected = product ?? { ...state.selected, isActive: false };
        }

        state.items = state.items.map((item) =>
          item.id === id ? (product ?? { ...item, isActive: false }) : item,
        );
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.payload ?? "Could not deactivate product.";
      });
  },
});

export const { clearProductFormErrors, clearSelectedProduct } =
  productsSlice.actions;

export default productsSlice.reducer;
