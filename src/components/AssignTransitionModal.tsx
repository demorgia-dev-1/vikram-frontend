"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import {
  Button,
  ErrorNote,
  Field,
  TransitionLabel,
  inputClass,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import { assignTransition } from "@/store/productWorkflowSlice";
import type { ProductTransition } from "@/types";

export default function AssignTransitionModal({
  productId,
  transition,
  onClose,
}: {
  productId: string;
  transition: ProductTransition | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { assigning, assignError } = useAppSelector(
    (state) => state.productWorkflow,
  );
  const users = useAppSelector((state) => state.users.items);

  const [assigneeUserId, setAssigneeUserId] = useState(
    transition?.assigneeId ?? "",
  );
  const [allowAttachments, setAllowAttachments] = useState(
    transition?.allowAttachments ?? false,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transition) return;

    const result = await dispatch(
      assignTransition({
        productId,
        transitionId: transition.id,
        payload: { assigneeUserId, allowAttachments },
      }),
    );

    if (assignTransition.fulfilled.match(result)) {
      const assignee = users.find((user) => user.id === assigneeUserId);
      dispatch(showToast(`Assigned to ${assignee?.name ?? "user"}`));
      onClose();
    }
  }

  return (
    <Modal
      open={Boolean(transition)}
      title={
        transition?.assigneeId ? "Reassign transition" : "Assign transition"
      }
      description="Only this user, or an admin, will be able to perform it."
      onClose={onClose}
      size="sm"
      closeDisabled={assigning}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={assigning}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="assign-form"
            loading={assigning}
            disabled={!assigneeUserId}
          >
            {assigning ? "Saving…" : "Save assignment"}
          </Button>
        </>
      }
    >
      {transition ? (
        <form id="assign-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <TransitionLabel transition={transition} />
          </div>

          <Field label="Assignee" htmlFor="assignee">
            <select
              id="assignee"
              required
              value={assigneeUserId}
              onChange={(event) => setAssigneeUserId(event.target.value)}
              disabled={assigning}
              className={inputClass}
            >
              <option value="">Select a user…</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-start gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              checked={allowAttachments}
              onChange={(event) => setAllowAttachments(event.target.checked)}
              disabled={assigning}
              className="mt-0.5 h-4 w-4 rounded border-border-subtle text-primary focus:ring-ring/25"
            />
            <span>
              Allow attachments
              <span className="block text-xs text-muted">
                The assignee may upload files when performing this transition.
              </span>
            </span>
          </label>

          {assignError ? <ErrorNote message={assignError} /> : null}
        </form>
      ) : null}
    </Modal>
  );
}
