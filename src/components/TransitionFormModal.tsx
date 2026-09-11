"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import {
  createTransition,
  updateTransition,
} from "@/store/workflowTemplatesSlice";
import type { WorkflowStage, WorkflowTransition } from "@/types";

/**
 * One dialog for both cases. On edit the API only accepts the name — the stages
 * a transition connects are fixed once it exists.
 */
export default function TransitionFormModal({
  open,
  templateId,
  stages,
  transition,
  defaults,
  onClose,
}: {
  open: boolean;
  templateId: string;
  stages: WorkflowStage[];
  transition?: WorkflowTransition | null;
  /** Prefilled when the pair came from dragging a connection in the graph. */
  defaults?: { srcStageId: string; destStageId: string } | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { saving, saveError } = useAppSelector(
    (state) => state.workflowTemplates,
  );

  const editing = Boolean(transition);
  const [form, setForm] = useState({
    name: transition?.name ?? "",
    srcStageId: defaults?.srcStageId ?? "",
    destStageId: defaults?.destStageId ?? "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (transition) {
      const result = await dispatch(
        updateTransition({
          templateId,
          transitionId: transition.id,
          payload: { name: form.name },
        }),
      );

      if (updateTransition.fulfilled.match(result)) {
        dispatch(showToast(`Transition renamed to “${form.name}”`));
        onClose();
      }
      return;
    }

    const result = await dispatch(
      createTransition({ templateId, payload: form }),
    );

    if (createTransition.fulfilled.match(result)) {
      dispatch(showToast(`“${form.name}” added`));
      onClose();
    }
  }

  const incomplete =
    !form.name ||
    (!editing &&
      (!form.srcStageId ||
        !form.destStageId ||
        form.srcStageId === form.destStageId));

  return (
    <Modal
      open={open}
      title={editing ? "Rename transition" : "Add transition"}
      description={
        editing
          ? "Only the name can be changed; it always connects the same stages."
          : "Names the action and connects two stages in the draft graph."
      }
      onClose={onClose}
      size="sm"
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="transition-form"
            loading={saving}
            disabled={incomplete}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add transition"}
          </Button>
        </>
      }
    >
      <form id="transition-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="transition-name">
          <input
            id="transition-name"
            required
            maxLength={200}
            placeholder="Approve"
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, name: event.target.value }))
            }
            disabled={saving}
            className={inputClass}
          />
        </Field>

        {editing ? (
          <div className="rounded-lg border border-border-subtle px-3 py-2.5 text-sm">
            <span className="font-medium">{transition?.srcStage.name}</span>
            <span className="px-1.5 text-subtle" aria-hidden>
              →
            </span>
            <span className="font-medium">{transition?.destStage.name}</span>
          </div>
        ) : (
          <>
            <Field label="From stage" htmlFor="src-stage">
              <select
                id="src-stage"
                required
                value={form.srcStageId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    srcStageId: event.target.value,
                  }))
                }
                disabled={saving}
                className={inputClass}
              >
                <option value="">Select a stage…</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="To stage" htmlFor="dest-stage">
              <select
                id="dest-stage"
                required
                value={form.destStageId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    destStageId: event.target.value,
                  }))
                }
                disabled={saving}
                className={inputClass}
              >
                <option value="">Select a stage…</option>
                {stages
                  .filter((stage) => stage.id !== form.srcStageId)
                  .map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
              </select>
            </Field>
          </>
        )}

        {saveError ? <ErrorNote message={saveError} /> : null}
      </form>
    </Modal>
  );
}
