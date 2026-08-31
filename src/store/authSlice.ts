import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { clearToken, getErrorMessage, getToken, setToken } from "@/lib/axios";
import type { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  meLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  meLoading: false,
};

export const loginUser = createAsyncThunk<
  { token: string | null; user: User | null },
  LoginPayload,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login", payload);

    // The API's token/user fields aren't fixed yet, so accept the common spellings.
    const token =
      data?.token ??
      data?.accessToken ??
      data?.access_token ??
      data?.data?.token ??
      data?.data?.accessToken ??
      data?.data?.access_token ??
      null;

    if (token) setToken(token);

    return { token, user: data?.user ?? data?.data?.user ?? null };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Login failed."));
  }
});

export const fetchMe = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<User>("/auth/me");
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Could not load profile."));
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Restores the token persisted in localStorage after a reload. */
    hydrateAuth(state) {
      state.token = getToken();
    },
    logout(state) {
      clearToken();
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed.";
      })
      .addCase(fetchMe.pending, (state) => {
        state.meLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.meLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        // A failed /auth/me means the stored token is no longer usable.
        state.meLoading = false;
        state.user = null;
        state.token = null;
        clearToken();
      });
  },
});

export const { hydrateAuth, logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
