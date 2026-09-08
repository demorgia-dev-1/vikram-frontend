"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import { createStage, updateStage } from "@/store/workflowTemplatesSlice";
import type { WorkflowStage } from "@/types";

export default function StageFormModal({
  open,
  templateId,
  stage,
  onClose,
}: {
  open: boolean;
  templateId: string;
  stage?: WorkflowStage | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { saving, saveError } = useAppSelector(
    (state) => state.workflowTemplates,
  );

  const editing = Boolean(stage);
  const [form, setForm] = useState({
    name: stage?.name ?? "",
    isInitial: stage?.isInitial ?? false,
    isTerminal: stage?.isTerminal ?? false,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // isInitial can only be set, never cleared — make another stage initial instead.
    const payload =
      editing && stage?.isInitial
        ? { name: form.name, isTerminal: form.isTerminal }
        : form;

    const result = stage
      ? await dispatch(updateStage({ templateId, stageId: stage.id, payload }))
      : await dispatch(createStage({ templateId, payload }));

    const ok = stage
      ? updateStage.fulfilled.match(result)
      : createStage.fulfilled.match(result);

    if (ok) {
      dispatch(
        showToast(
          stage ? `Stage “${form.name}” updated` : `Stage “${form.name}” added`,
        ),
      );
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? "Edit stage" : "Add stage"}
      onClose={onClose}
      size="sm"
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="stage-form" loading={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add stage"}
          </Button>
        </>
      }
    >
      <form id="stage-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Stage name" htmlFor="stage-name">
          <input
            id="stage-name"
            required
            placeholder="Manager review"
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, name: event.target.value }))
            }
            disabled={saving}
            className={inputClass}
          />
        </Field>

        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isInitial}
            disabled={saving || (editing && stage?.isInitial)}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                isInitial: event.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-border-subtle text-primary"
          />
          <span>
            Initial stage
            <span className="block text-xs text-subtle">
              {editing && stage?.isInitial
                ? "Already the initial stage — make another stage initial to move it."
                : "Only one stage can be initial; setting this moves it here."}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isTerminal}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                isTerminal: event.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-border-subtle text-primary"
          />
          <span>
            Terminal stage
            <span className="block text-xs text-subtle">
              An end state — nothing moves out of it.
            </span>
          </span>
        </label>

        {saveError ? <ErrorNote message={saveError} /> : null}
      </form>
    </Modal>
  );
}
