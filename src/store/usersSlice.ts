import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/axios";
import type { ListParams, Meta, Paginated, User } from "@/types";

interface UsersState {
  items: User[];
  meta: Meta | null;
  loading: boolean;
  error: string | null;
  selected: User | null;
  selectedLoading: boolean;
  selectedError: string | null;
}

const initialState: UsersState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  selected: null,
  selectedLoading: false,
  selectedError: null,
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

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSelectedUser(state) {
      state.selected = null;
      state.selectedError = null;
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
      });
  },
});

export const { clearSelectedUser } = usersSlice.actions;

export default usersSlice.reducer;
