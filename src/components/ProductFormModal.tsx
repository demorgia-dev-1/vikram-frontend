"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  Button,
  ErrorNote,
  Field,
  Spinner,
  TransitionLabel,
  inputClass,
  labelClass,
} from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchCustomers } from "@/store/customersSlice";
import { createProduct, updateProduct } from "@/store/productsSlice";
import { fetchUsers } from "@/store/usersSlice";
import {
  clearTemplateGraph,
  fetchTemplateVersion,
  fetchTemplateVersions,
  fetchTemplates,
} from "@/store/workflowTemplatesSlice";
import type { Product, TransitionAssignmentInput } from "@/types";

type Assignment = { assigneeUserId: string; allowAttachments: boolean };

const EMPTY_FORM = {
  name: "",
  description: "",
  customerId: "",
  workflowTemplateId: "",
  workflowTemplateVersion: 0,
};

/**
 * One dialog for both create and edit. On edit the API only accepts name and
 * description — customer and workflow template are fixed once the product exists.
 */
export default function ProductFormModal({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { creating, createError, updating, updateError } = useAppSelector(
    (state) => state.products,
  );
  const customers = useAppSelector((state) => state.customers.items);
  const users = useAppSelector((state) => state.users.items);
  const {
    items: templates,
    loading: templatesLoading,
    versions,
    versionsLoading,
    version: graph,
    versionLoading,
    versionError,
  } = useAppSelector((state) => state.workflowTemplates);

  const editing = Boolean(product);
  const saving = editing ? updating : creating;
  const error = editing ? updateError : createError;

  const [form, setForm] = useState(
    product
      ? { ...EMPTY_FORM, name: product.name, description: product.description }
      : EMPTY_FORM,
  );
  // Keyed by transition id: the rows themselves come from the published graph,
  // so nothing here has to be kept in sync with the fetched template.
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});

  // The create form needs customers, users and templates to populate its pickers.
  useEffect(() => {
    if (!open || editing) return;
    dispatch(fetchCustomers({ page: 1, limit: 100 }));
    dispatch(fetchUsers({ page: 1, limit: 100 }));
    dispatch(fetchTemplates());
  }, [open, editing, dispatch]);

  function setValue<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleTemplateChange(templateId: string) {
    setForm((previous) => ({
      ...previous,
      workflowTemplateId: templateId,
      workflowTemplateVersion: 0,
    }));
    setAssignments({});
    dispatch(clearTemplateGraph());

    if (templateId) dispatch(fetchTemplateVersions(templateId));
  }

  function handleVersionChange(version: number) {
    setValue("workflowTemplateVersion", version);
    setAssignments({});

    if (version) {
      dispatch(
        fetchTemplateVersion({ id: form.workflowTemplateId, version }),
      );
    }
  }

  function updateAssignment(transitionId: string, patch: Partial<Assignment>) {
    setAssignments((previous) => {
      const current = previous[transitionId] ?? {
        assigneeUserId: "",
        allowAttachments: false,
      };

      return { ...previous, [transitionId]: { ...current, ...patch } };
    });
  }

  // Only transitions with an assignee are sent; the rest fall back to workflow defaults.
  function collectAssignments(): TransitionAssignmentInput[] {
    if (!graph) return [];

    return graph.transitions
      .filter((transition) => assignments[transition.id]?.assigneeUserId)
      .map((transition) => ({
        transitionId: transition.id,
        assigneeUserId: assignments[transition.id].assigneeUserId,
        allowAttachments: assignments[transition.id].allowAttachments,
      }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = product
      ? await dispatch(
          updateProduct({
            id: product.id,
            payload: { name: form.name, description: form.description },
          }),
        )
      : await dispatch(
          createProduct({ ...form, transitionAssignments: collectAssignments() }),
        );

    const ok = product
      ? updateProduct.fulfilled.match(result)
      : createProduct.fulfilled.match(result);

    if (ok) {
      onSaved?.();
      onClose();
    }
  }

  const graphMatchesSelection =
    graph?.version === form.workflowTemplateVersion &&
    Boolean(form.workflowTemplateVersion);

  return (
    <Modal
      open={open}
      title={editing ? "Edit product" : "New product"}
      description={
        editing
          ? "Only the name and description can be changed after creation."
          : "Register a part and attach it to a customer's workflow."
      }
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="product-name">
          <input
            id="product-name"
            required
            placeholder="Landing Gear Overhaul Kit"
            value={form.name}
            onChange={(event) => setValue("name", event.target.value)}
            disabled={saving}
            className={inputClass}
          />
        </Field>

        <Field label="Description" htmlFor="product-description">
          <textarea
            id="product-description"
            required
            rows={2}
            placeholder="Full overhaul kit for A320 main landing gear assemblies"
            value={form.description}
            onChange={(event) => setValue("description", event.target.value)}
            disabled={saving}
            className={inputClass}
          />
        </Field>

        {editing ? null : (
          <>
            <Field label="Customer" htmlFor="product-customer">
              <select
                id="product-customer"
                required
                value={form.customerId}
                onChange={(event) => setValue("customerId", event.target.value)}
                disabled={saving}
                className={inputClass}
              >
                <option value="">Select a customer…</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
              <Field label="Workflow template" htmlFor="product-template">
                <select
                  id="product-template"
                  required
                  value={form.workflowTemplateId}
                  onChange={(event) => handleTemplateChange(event.target.value)}
                  disabled={saving || templatesLoading}
                  className={inputClass}
                >
                  <option value="">
                    {templatesLoading ? "Loading templates…" : "Select a template…"}
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Version" htmlFor="product-version">
                <select
                  id="product-version"
                  required
                  value={form.workflowTemplateVersion || ""}
                  onChange={(event) =>
                    handleVersionChange(Number(event.target.value))
                  }
                  disabled={
                    saving || !form.workflowTemplateId || versionsLoading
                  }
                  className={inputClass}
                >
                  <option value="">
                    {versionsLoading ? "Loading…" : "Select…"}
                  </option>
                  {versions.map((item) => (
                    <option key={item.id} value={item.version}>
                      v{item.version}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {form.workflowTemplateId && !versionsLoading && versions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                This template has no published versions yet, so a product cannot
                be created against it.
              </p>
            ) : null}

            <div>
              <span className={labelClass}>Transition assignments</span>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Transitions come from the selected published version. Leave a
                transition unassigned to use the workflow&apos;s own default.
              </p>

              <div className="mt-2 space-y-3">
                {versionLoading ? (
                  <div className="flex justify-center py-6 text-slate-400">
                    <Spinner className="h-5 w-5" />
                  </div>
                ) : versionError ? (
                  <ErrorNote message={versionError} />
                ) : !graphMatchesSelection ? (
                  <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Pick a template and version to load its transitions.
                  </p>
                ) : graph.transitions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    This version has no transitions.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                    {graph.transitions.map((transition) => {
                      const assignment = assignments[transition.id];
                      const label = `${transition.srcStage.name} → ${transition.destStage.name}`;

                      return (
                        <div
                          key={transition.id}
                          className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                        >
                          <TransitionLabel transition={transition} />

                          <select
                            aria-label={`Assignee for ${label}`}
                            value={assignment?.assigneeUserId ?? ""}
                            onChange={(event) =>
                              updateAssignment(transition.id, {
                                assigneeUserId: event.target.value,
                              })
                            }
                            disabled={saving}
                            className={`${inputClass} w-full py-1.5 text-xs sm:w-44`}
                          >
                            <option value="">Unassigned</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>

                          <label
                            title="Allow attachments on this transition"
                            className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                          >
                            <input
                              type="checkbox"
                              checked={assignment?.allowAttachments ?? false}
                              onChange={(event) =>
                                updateAssignment(transition.id, {
                                  allowAttachments: event.target.checked,
                                })
                              }
                              disabled={saving || !assignment?.assigneeUserId}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
                            />
                            Attachments
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {error ? <ErrorNote message={error} /> : null}
      </form>
    </Modal>
  );
}
