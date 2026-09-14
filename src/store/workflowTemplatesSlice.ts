import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, listQuery } from "@/lib/axios";
import type {
  StagePayload,
  TemplateListParams,
  TransitionPayload,
  TransitionUpdatePayload,
  WorkflowTemplate,
  WorkflowTemplatePayload,
  WorkflowTemplateDetail,
  WorkflowTemplateVersion,
  WorkflowTemplateVersionDetail,
} from "@/types";

interface WorkflowTemplatesState {
  items: WorkflowTemplate[];
  loading: boolean;
  error: string | null;
  selected: WorkflowTemplateDetail | null;
  selectedLoading: boolean;
  selectedError: string | null;
  versions: WorkflowTemplateVersion[];
  versionsLoading: boolean;
  versionsError: string | null;
  version: WorkflowTemplateVersionDetail | null;
  versionLoading: boolean;
  versionError: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: WorkflowTemplatesState = {
  items: [],
  loading: false,
  error: null,
  selected: null,
  selectedLoading: false,
  selectedError: null,
  versions: [],
  versionsLoading: false,
  versionsError: null,
  version: null,
  versionLoading: false,
  versionError: null,
  saving: false,
  saveError: null,
};

/** The API paginates this list; a bare array is accepted too. */
export const fetchTemplates = createAsyncThunk<
  WorkflowTemplate[],
  TemplateListParams | void,
  { rejectValue: string }
>("workflowTemplates/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/workflow-templates", {
      params: listQuery({
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        search: params?.search,
      }),
    });
    return (
      Array.isArray(data) ? data : (data?.data ?? [])
    ) as WorkflowTemplate[];
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not load workflow templates."),
    );
  }
});

export const fetchTemplateById = createAsyncThunk<
  WorkflowTemplateDetail,
  string,
  { rejectValue: string }
>("workflowTemplates/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get<WorkflowTemplateDetail>(
      `/workflow-templates/${id}`,
    );
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load template."));
  }
});

export const fetchTemplateVersions = createAsyncThunk<
  WorkflowTemplateVersion[],
  string,
  { rejectValue: string }
>("workflowTemplates/fetchVersions", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get<WorkflowTemplateVersion[]>(
      `/workflow-templates/${id}/versions`,
    );
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not load versions."));
  }
});

export const fetchTemplateVersion = createAsyncThunk<
  WorkflowTemplateVersionDetail,
  { id: string; version: number },
  { rejectValue: string }
>(
  "workflowTemplates/fetchVersion",
  async ({ id, version }, { rejectWithValue }) => {
    try {
      const { data } = await api.get<WorkflowTemplateVersionDetail>(
        `/workflow-templates/${id}/versions/${version}`,
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not load this version."),
      );
    }
  },
);

export const createTemplate = createAsyncThunk<
  WorkflowTemplate,
  WorkflowTemplatePayload,
  { rejectValue: string }
>("workflowTemplates/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<WorkflowTemplate>(
      "/workflow-templates",
      payload,
    );
    return data;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not create template."),
    );
  }
});

export const updateTemplate = createAsyncThunk<
  WorkflowTemplate,
  { id: string; payload: WorkflowTemplatePayload },
  { rejectValue: string }
>("workflowTemplates/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<WorkflowTemplate>(
      `/workflow-templates/${id}`,
      payload,
    );
    return data;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not update template."),
    );
  }
});

export const deleteTemplate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("workflowTemplates/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/workflow-templates/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Could not delete template."),
    );
  }
});

/* --- draft graph editing: stages, transitions, publish --- */

export const createStage = createAsyncThunk<
  void,
  { templateId: string; payload: StagePayload },
  { rejectValue: string }
>(
  "workflowTemplates/createStage",
  async ({ templateId, payload }, { dispatch, rejectWithValue }) => {
    try {
      await api.post(`/workflow-templates/${templateId}/stages`, payload);
      await dispatch(fetchTemplateById(templateId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not add the stage."),
      );
    }
  },
);

export const updateStage = createAsyncThunk<
  void,
  { templateId: string; stageId: string; payload: StagePayload },
  { rejectValue: string }
>(
  "workflowTemplates/updateStage",
  async ({ templateId, stageId, payload }, { dispatch, rejectWithValue }) => {
    try {
      await api.patch(
        `/workflow-templates/${templateId}/stages/${stageId}`,
        payload,
      );
      await dispatch(fetchTemplateById(templateId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not update the stage."),
      );
    }
  },
);

export const deleteStage = createAsyncThunk<
  void,
  { templateId: string; stageId: string },
  { rejectValue: string }
>(
  "workflowTemplates/deleteStage",
  async ({ templateId, stageId }, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/workflow-templates/${templateId}/stages/${stageId}`);
      await dispatch(fetchTemplateById(templateId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not delete the stage."),
      );
    }
  },
);

export const createTransition = createAsyncThunk<
  void,
  { templateId: string; payload: TransitionPayload },
  { rejectValue: string }
>(
  "workflowTemplates/createTransition",
  async ({ templateId, payload }, { dispatch, rejectWithValue }) => {
    try {
      await api.post(`/workflow-templates/${templateId}/transitions`, payload);
      await dispatch(fetchTemplateById(templateId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not add the transition."),
      );
    }
  },
);

export const updateTransition = createAsyncThunk<
  void,
  {
    templateId: string;
    transitionId: string;
    payload: TransitionUpdatePayload;
  },
  { rejectValue: string }
>(
  "workflowTemplates/updateTransition",
  async (
    { templateId, transitionId, payload },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await api.patch(
        `/workflow-templates/${templateId}/transitions/${transitionId}`,
        payload,
      );
      await dispatch(fetchTemplateById(templateId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not update the transition."),
      );
    }
  },
);

export const deleteTransition = createAsyncThunk<
  void,
  { templateId: string; transitionId: string },
  { rejectValue: string }
>(
  "workflowTemplates/deleteTransition",
  async ({ templateId, transitionId }, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(
        `/workflow-templates/${templateId}/transitions/${transitionId}`,
      );
      await dispatch(fetchTemplateById(templateId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not delete the transition."),
      );
    }
  },
);

/** Snapshots the draft graph as a new immutable version. */
export const publishTemplate = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "workflowTemplates/publish",
  async (templateId, { dispatch, rejectWithValue }) => {
    try {
      await api.post(`/workflow-templates/${templateId}/publish`);
      await dispatch(fetchTemplateVersions(templateId));
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not publish this template."),
      );
    }
  },
);

const workflowTemplatesSlice = createSlice({
  name: "workflowTemplates",
  initialState,
  reducers: {
    clearSelectedTemplate(state) {
      state.selected = null;
      state.selectedError = null;
      state.versions = [];
      state.versionsError = null;
      state.version = null;
      state.versionError = null;
    },
    /** Called when the picked template changes, so a stale graph is never shown. */
    clearSaveError(state) {
      state.saveError = null;
    },
    clearTemplateGraph(state) {
      state.versions = [];
      state.versionsError = null;
      state.version = null;
      state.versionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Could not load workflow templates.";
      })

      .addCase(fetchTemplateById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload ?? "Could not load template.";
      })

      .addCase(fetchTemplateVersions.pending, (state) => {
        state.versionsLoading = true;
        state.versionsError = null;
      })
      .addCase(fetchTemplateVersions.fulfilled, (state, action) => {
        state.versionsLoading = false;
        state.versions = action.payload;
      })
      .addCase(fetchTemplateVersions.rejected, (state, action) => {
        state.versionsLoading = false;
        state.versionsError = action.payload ?? "Could not load versions.";
      })

      .addCase(fetchTemplateVersion.pending, (state) => {
        state.versionLoading = true;
        state.versionError = null;
      })
      .addCase(fetchTemplateVersion.fulfilled, (state, action) => {
        state.versionLoading = false;
        state.version = action.payload;
      })
      .addCase(fetchTemplateVersion.rejected, (state, action) => {
        state.versionLoading = false;
        state.versionError = action.payload ?? "Could not load this version.";
      })

      // Every mutation shares one saving/saveError pair.
      .addMatcher(
        (action) =>
          action.type.startsWith("workflowTemplates/") &&
          action.type.endsWith("/pending") &&
          !action.type.startsWith("workflowTemplates/fetch"),
        (state) => {
          state.saving = true;
          state.saveError = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("workflowTemplates/") &&
          action.type.endsWith("/fulfilled") &&
          !action.type.startsWith("workflowTemplates/fetch"),
        (state) => {
          state.saving = false;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("workflowTemplates/") &&
          action.type.endsWith("/rejected") &&
          !action.type.startsWith("workflowTemplates/fetch"),
        (state, action) => {
          state.saving = false;
          state.saveError =
            (action as { payload?: string }).payload ?? "Something went wrong.";
        },
      );
  },
});

export const { clearSaveError, clearSelectedTemplate, clearTemplateGraph } =
  workflowTemplatesSlice.actions;

export default workflowTemplatesSlice.reducer;
