"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import { createTransition } from "@/store/workflowTemplatesSlice";
import type { WorkflowStage } from "@/types";

export default function TransitionFormModal({
  open,
  templateId,
  stages,
  onClose,
}: {
  open: boolean;
  templateId: string;
  stages: WorkflowStage[];
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { saving, saveError } = useAppSelector(
    (state) => state.workflowTemplates,
  );

  const [form, setForm] = useState({ srcStageId: "", destStageId: "" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await dispatch(
      createTransition({ templateId, payload: form }),
    );

    if (createTransition.fulfilled.match(result)) {
      const name = (id: string) =>
        stages.find((stage) => stage.id === id)?.name ?? "stage";
      dispatch(
        showToast(`${name(form.srcStageId)} → ${name(form.destStageId)} added`),
      );
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      title="Add transition"
      description="Connects two stages in the draft graph."
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
            disabled={
              !form.srcStageId ||
              !form.destStageId ||
              form.srcStageId === form.destStageId
            }
          >
            {saving ? "Saving…" : "Add transition"}
          </Button>
        </>
      }
    >
      <form id="transition-form" onSubmit={handleSubmit} className="space-y-4">
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

        {saveError ? <ErrorNote message={saveError} /> : null}
      </form>
    </Modal>
  );
}
