import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/axios";
import type {
  Customer,
  CustomerPayload,
  ListParams,
  Meta,
  Paginated,
} from "@/types";

interface CustomersState {
  items: Customer[];
  meta: Meta | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  selected: Customer | null;
  selectedLoading: boolean;
  selectedError: string | null;
  updating: boolean;
  updateError: string | null;
  deleting: boolean;
  deleteError: string | null;
}

const initialState: CustomersState = {
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

export const fetchCustomers = createAsyncThunk<
  Paginated<Customer>,
  ListParams | void,
  { rejectValue: string }
>("customers/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Paginated<Customer>>("/customers", {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 20 },
    });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load customers."));
  }
});

export const fetchCustomerById = createAsyncThunk<
  Customer,
  string,
  { rejectValue: string }
>("customers/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Customer>(`/customers/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load customer."));
  }
});

export const createCustomer = createAsyncThunk<
  Customer,
  CustomerPayload,
  { rejectValue: string }
>("customers/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<Customer>("/customers", payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not create customer."));
  }
});

export const updateCustomer = createAsyncThunk<
  Customer,
  { id: string; payload: CustomerPayload },
  { rejectValue: string }
>("customers/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<Customer>(`/customers/${id}`, payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not update customer."));
  }
});

/** Soft delete: the API deactivates the customer rather than removing it. */
export const deleteCustomer = createAsyncThunk<
  { id: string; customer: Customer | null },
  string,
  { rejectValue: string }
>("customers/delete", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete<Customer | null>(`/customers/${id}`);
    // A 204 leaves no body, so fall back to flipping isActive locally.
    return { id, customer: data && data.id ? data : null };
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not deactivate customer."),
    );
  }
});

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearCreateError(state) {
      state.createError = null;
    },
    clearSelectedCustomer(state) {
      state.selected = null;
      state.selectedError = null;
      state.updateError = null;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Could not load customers.";
      })

      .addCase(fetchCustomerById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload ?? "Could not load customer.";
      })

      .addCase(createCustomer.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createCustomer.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload ?? "Could not create customer.";
      })

      .addCase(updateCustomer.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.updating = false;
        state.selected = action.payload;
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload ?? "Could not update customer.";
      })

      .addCase(deleteCustomer.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        const { id, customer } = action.payload;
        state.deleting = false;

        if (state.selected?.id === id) {
          state.selected = customer ?? { ...state.selected, isActive: false };
        }

        state.items = state.items.map((item) =>
          item.id === id ? (customer ?? { ...item, isActive: false }) : item,
        );
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.payload ?? "Could not deactivate customer.";
      });
  },
});

export const { clearCreateError, clearSelectedCustomer } =
  customersSlice.actions;

export default customersSlice.reducer;
