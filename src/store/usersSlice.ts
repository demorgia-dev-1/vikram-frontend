import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/axios";
import type { ListParams, Meta, Paginated, User, UserPayload } from "@/types";

interface UsersState {
  items: User[];
  meta: Meta | null;
  loading: boolean;
  error: string | null;
  selected: User | null;
  selectedLoading: boolean;
  selectedError: string | null;
  updating: boolean;
  updateError: string | null;
  deleting: boolean;
  deleteError: string | null;
}

const initialState: UsersState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  selected: null,
  selectedLoading: false,
  selectedError: null,
  updating: false,
  updateError: null,
  deleting: false,
  deleteError: null,
};

export const fetchUsers = createAsyncThunk<
  Paginated<User>,
  ListParams | void,
  { rejectValue: string }
>("users/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Paginated<User>>("/users", {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 20 },
    });
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load users."));
  }
});

export const fetchUserById = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>("users/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load user."));
  }
});

export const updateUser = createAsyncThunk<
  User,
  { id: string; payload: UserPayload },
  { rejectValue: string }
>("users/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<User>(`/users/${id}`, payload);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not update user."));
  }
});

/** Soft delete: the API deactivates the account rather than removing it. */
export const deleteUser = createAsyncThunk<
  { id: string; user: User | null },
  string,
  { rejectValue: string }
>("users/delete", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete<User | null>(`/users/${id}`);
    // A 204 leaves no body, so fall back to flipping isActive locally.
    return { id, user: data && data.id ? data : null };
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not deactivate user."),
    );
  }
});

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSelectedUser(state) {
      state.selected = null;
      state.selectedError = null;
      state.updateError = null;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Could not load users.";
      })
      .addCase(fetchUserById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload ?? "Could not load user.";
      })

      .addCase(updateUser.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updating = false;
        state.selected = action.payload;
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload ?? "Could not update user.";
      })

      .addCase(deleteUser.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const { id, user } = action.payload;
        state.deleting = false;

        if (state.selected?.id === id) {
          state.selected = user ?? { ...state.selected, isActive: false };
        }

        state.items = state.items.map((item) =>
          item.id === id ? (user ?? { ...item, isActive: false }) : item,
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.payload ?? "Could not deactivate user.";
      });
  },
});

export const { clearSelectedUser } = usersSlice.actions;

export default usersSlice.reducer;
