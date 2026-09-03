import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/axios";
import type {
  WorkflowTemplate,
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
};

/** This endpoint returns a bare array, not a paginated envelope. */
export const fetchTemplates = createAsyncThunk<
  WorkflowTemplate[],
  void,
  { rejectValue: string }
>("workflowTemplates/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<WorkflowTemplate[]>("/workflow-templates");
    return data;
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
      });
  },
});

export const { clearSelectedTemplate, clearTemplateGraph } =
  workflowTemplatesSlice.actions;

export default workflowTemplatesSlice.reducer;
