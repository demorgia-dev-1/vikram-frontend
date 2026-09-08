import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type ToastTone = "success" | "error" | "info";

export type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
};

/** Beyond this the stack covers the screen rather than informing anyone. */
const MAX_VISIBLE = 4;

const toastSlice = createSlice({
  name: "toasts",
  initialState: [] as Toast[],
  reducers: {
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.push(action.payload);
        if (state.length > MAX_VISIBLE) state.shift();
      },
      prepare(message: string, tone: ToastTone = "success") {
        return { payload: { id: nanoid(), message, tone } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      return state.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
