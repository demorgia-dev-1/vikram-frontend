"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import { createTemplate, updateTemplate } from "@/store/workflowTemplatesSlice";
import type { WorkflowTemplate } from "@/types";

/** One dialog for both create and edit; `template` decides which. */
export default function TemplateFormModal({
  open,
  template,
  onClose,
  onSaved,
}: {
  open: boolean;
  template?: WorkflowTemplate | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { saving, saveError } = useAppSelector(
    (state) => state.workflowTemplates,
  );

  const editing = Boolean(template);
  const [form, setForm] = useState({
    name: template?.name ?? "",
    description: template?.description ?? "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = template
      ? await dispatch(updateTemplate({ id: template.id, payload: form }))
      : await dispatch(createTemplate(form));

    const ok = template
      ? updateTemplate.fulfilled.match(result)
      : createTemplate.fulfilled.match(result);

    if (ok) {
      dispatch(
        showToast(template ? `${form.name} updated` : `${form.name} created`),
      );
      onSaved?.();
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? "Edit template" : "New workflow template"}
      description={
        editing
          ? "Rename the template or update its description."
          : "Creates an empty draft. Add stages and transitions, then publish it."
      }
      onClose={onClose}
      size="sm"
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="template-form" loading={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create template"}
          </Button>
        </>
      }
    >
      <form id="template-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="template-name">
          <input
            id="template-name"
            required
            minLength={2}
            placeholder="Purchase order approval"
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, name: event.target.value }))
            }
            disabled={saving}
            className={inputClass}
          />
        </Field>

        <Field label="Description" htmlFor="template-description">
          <textarea
            id="template-description"
            rows={3}
            placeholder="Approval flow for purchase orders over $1000"
            value={form.description ?? ""}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            disabled={saving}
            className={inputClass}
          />
        </Field>

        {saveError ? <ErrorNote message={saveError} /> : null}
      </form>
    </Modal>
  );
}
