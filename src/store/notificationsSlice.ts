import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, listQuery } from "@/lib/axios";
import type {
  Meta,
  Notification,
  NotificationListParams,
  Paginated,
} from "@/types";

interface NotificationsState {
  items: Notification[];
  meta: Meta | null;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  /** Whether the live stream is currently connected. */
  streaming: boolean;
}

const initialState: NotificationsState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  unreadCount: 0,
  streaming: false,
};

export const fetchNotifications = createAsyncThunk<
  Paginated<Notification>,
  NotificationListParams | void,
  { rejectValue: string }
>("notifications/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Paginated<Notification>>("/notifications", {
      params: listQuery({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        isRead: params?.isRead,
      }),
    });
    return data;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not load notifications."),
    );
  }
});

export const fetchUnreadCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notifications/unreadCount", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<{ count: number }>(
      "/notifications/unread-count",
    );
    return data.count ?? 0;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load the count."));
  }
});

export const markNotificationRead = createAsyncThunk<
  Notification,
  string,
  { rejectValue: string }
>("notifications/markRead", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
    return data;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not mark that as read."),
    );
  }
});

export const markAllNotificationsRead = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notifications/markAllRead", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<{ count: number }>(
      "/notifications/read-all",
    );
    return data.count ?? 0;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not mark them as read."),
    );
  }
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    /** One notification pushed down the SSE stream. */
    notificationReceived(state, action: { payload: Notification }) {
      const incoming = action.payload;
      if (state.items.some((item) => item.id === incoming.id)) return;

      state.items.unshift(incoming);
      if (!incoming.isRead) state.unreadCount += 1;
    },
    setStreaming(state, action: { payload: boolean }) {
      state.streaming = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Could not load notifications.";
      })

      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const existing = state.items.find((item) => item.id === updated.id);

        // Only decrement when this call is what flipped it.
        if (existing && !existing.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }

        state.items = state.items.map((item) =>
          item.id === updated.id ? { ...updated, isRead: true } : item,
        );
      })

      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.unreadCount = 0;
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
      });
  },
});

export const { notificationReceived, setStreaming } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
