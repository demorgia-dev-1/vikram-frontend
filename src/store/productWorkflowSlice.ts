import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/axios";
import type {
  AssignTransitionPayload,
  AttachmentRef,
  HistoryEntry,
  PresignFileRequest,
  PresignedUpload,
  ProductTransition,
  WorkflowStage,
} from "@/types";

interface ProductWorkflowState {
  transitions: ProductTransition[];
  transitionsLoading: boolean;
  transitionsError: string | null;
  history: HistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
  assigning: boolean;
  assignError: string | null;
  performing: boolean;
  performError: string | null;
}

const initialState: ProductWorkflowState = {
  transitions: [],
  transitionsLoading: false,
  transitionsError: null,
  history: [],
  historyLoading: false,
  historyError: null,
  assigning: false,
  assignError: null,
  performing: false,
  performError: null,
};

const UNKNOWN_STAGE = {
  id: "",
  name: "—",
  isInitial: false,
  isTerminal: false,
};

/**
 * This endpoint merges dop_api's transition with vikram-api's assignee, and the
 * two sides don't agree on field names — so accept the plausible spellings and
 * hand the UI one canonical shape.
 */
type RawTransition = {
  id?: string;
  transitionId?: string;
  srcStage?: WorkflowStage;
  sourceStage?: WorkflowStage;
  fromStage?: WorkflowStage;
  destStage?: WorkflowStage;
  toStage?: WorkflowStage;
  assignee?: { id?: string; name?: string; email?: string } | null;
  assigneeId?: string | null;
  assigneeUserId?: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  allowAttachments?: boolean;
};

function normalizeTransition(
  value: RawTransition,
  index: number,
): ProductTransition {
  return {
    id: value.id ?? value.transitionId ?? `transition-${index}`,
    srcStage: value.srcStage ?? value.sourceStage ?? value.fromStage ?? UNKNOWN_STAGE,
    destStage: value.destStage ?? value.toStage ?? UNKNOWN_STAGE,
    assigneeId: value.assignee?.id ?? value.assigneeId ?? value.assigneeUserId ?? null,
    assigneeName: value.assignee?.name ?? value.assigneeName ?? null,
    assigneeEmail: value.assignee?.email ?? value.assigneeEmail ?? null,
    allowAttachments: value.allowAttachments ?? false,
  };
}

export const fetchProductTransitions = createAsyncThunk<
  ProductTransition[],
  string,
  { rejectValue: string }
>("productWorkflow/transitions", async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/products/${productId}/transitions`);
    const list = Array.isArray(data) ? data : (data?.data ?? data?.transitions ?? []);

    return (list as RawTransition[]).map(normalizeTransition);
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not load transitions."),
    );
  }
});

export const fetchProductHistory = createAsyncThunk<
  HistoryEntry[],
  string,
  { rejectValue: string }
>("productWorkflow/history", async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.get<HistoryEntry[]>(
      `/products/${productId}/history`,
    );
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load history."));
  }
});

export const assignTransition = createAsyncThunk<
  void,
  {
    productId: string;
    transitionId: string;
    payload: AssignTransitionPayload;
  },
  { rejectValue: string }
>(
  "productWorkflow/assign",
  async ({ productId, transitionId, payload }, { dispatch, rejectWithValue }) => {
    try {
      await api.put(
        `/products/${productId}/transitions/${transitionId}/assignee`,
        payload,
      );
      // The response shape isn't guaranteed, so re-read the merged list.
      await dispatch(fetchProductTransitions(productId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not assign this transition."),
      );
    }
  },
);

type RawPresigned = {
  key: string;
  uploadUrl?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
};

/** S3 upload targets. The API returns `uploadUrl`; normalize it to `url`. */
export const presignAttachments = createAsyncThunk<
  PresignedUpload[],
  { productId: string; transitionId: string; files: PresignFileRequest[] },
  { rejectValue: string }
>(
  "productWorkflow/presign",
  async ({ productId, transitionId, files }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        `/products/${productId}/transitions/${transitionId}/attachments/presign`,
        { files },
      );

      const list = Array.isArray(data)
        ? data
        : (data?.files ?? data?.uploads ?? data?.data ?? []);

      return (list as RawPresigned[]).map((item) => ({
        url: item.uploadUrl ?? item.url ?? "",
        key: item.key,
        fileName: item.fileName,
        mimeType: item.mimeType,
      }));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not prepare the upload."),
      );
    }
  },
);

export const performTransition = createAsyncThunk<
  void,
  { productId: string; transitionId: string; attachments: AttachmentRef[] },
  { rejectValue: string }
>(
  "productWorkflow/perform",
  async (
    { productId, transitionId, attachments },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await api.post(
        `/products/${productId}/transitions/${transitionId}/perform`,
        { attachments },
      );

      await Promise.all([
        dispatch(fetchProductHistory(productId)),
        dispatch(fetchProductTransitions(productId)),
      ]);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not perform this transition."),
      );
    }
  },
);

/** Fetches a short-lived download URL for one history attachment. */
export async function fetchAttachmentUrl(
  productId: string,
  logId: string,
  attachmentId: string,
): Promise<string> {
  const { data } = await api.get<{ url: string }>(
    `/products/${productId}/history/${logId}/attachments/${attachmentId}/download-url`,
  );

  return data.url;
}

const productWorkflowSlice = createSlice({
  name: "productWorkflow",
  initialState,
  reducers: {
    clearProductWorkflow: () => initialState,
    clearWorkflowActionErrors(state) {
      state.assignError = null;
      state.performError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductTransitions.pending, (state) => {
        state.transitionsLoading = true;
        state.transitionsError = null;
      })
      .addCase(fetchProductTransitions.fulfilled, (state, action) => {
        state.transitionsLoading = false;
        state.transitions = action.payload;
      })
      .addCase(fetchProductTransitions.rejected, (state, action) => {
        state.transitionsLoading = false;
        state.transitionsError =
          action.payload ?? "Could not load transitions.";
      })

      .addCase(fetchProductHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchProductHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchProductHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload ?? "Could not load history.";
      })

      .addCase(assignTransition.pending, (state) => {
        state.assigning = true;
        state.assignError = null;
      })
      .addCase(assignTransition.fulfilled, (state) => {
        state.assigning = false;
      })
      .addCase(assignTransition.rejected, (state, action) => {
        state.assigning = false;
        state.assignError = action.payload ?? "Could not assign this transition.";
      })

      .addCase(performTransition.pending, (state) => {
        state.performing = true;
        state.performError = null;
      })
      .addCase(performTransition.fulfilled, (state) => {
        state.performing = false;
      })
      .addCase(performTransition.rejected, (state, action) => {
        state.performing = false;
        state.performError =
          action.payload ?? "Could not perform this transition.";
      });
  },
});

export const { clearProductWorkflow, clearWorkflowActionErrors } =
  productWorkflowSlice.actions;

export default productWorkflowSlice.reducer;
