"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { showToast } from "@/store/toastSlice";
import { createUser, updateUser } from "@/store/usersSlice";
import { ROLES, type User, type UserPayload } from "@/types";

export default function UserFormModal({
  open,
  user,
  onClose,
  onSaved,
}: {
  /** Create mode is driven by `open`; edit mode by a non-null `user`. */
  open?: boolean;
  user?: User | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { creating, createError, updating, updateError } = useAppSelector(
    (state) => state.users,
  );

  const editing = Boolean(user);
  const saving = editing ? updating : creating;
  const error = editing ? updateError : createError;

  const [form, setForm] = useState<UserPayload>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "USER",
  });
  const [password, setPassword] = useState("");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = user
      ? await dispatch(updateUser({ id: user.id, payload: form }))
      : await dispatch(createUser({ ...form, password }));

    const ok = user
      ? updateUser.fulfilled.match(result)
      : createUser.fulfilled.match(result);

    if (ok) {
      dispatch(showToast(user ? `${form.name} updated` : `${form.name} added`));
      onSaved?.();
      onClose();
    }
  }

  return (
    <Modal
      open={Boolean(user) || Boolean(open)}
      title={editing ? "Edit user" : "New user"}
      description={
        editing
          ? "Update this account's name, email and role."
          : "Creates a portal account with an initial password."
      }
      onClose={onClose}
      size="sm"
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create user"}
          </Button>
        </>
      }
    >
      {Boolean(user) || open ? (
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name" htmlFor="user-name">
            <input
              id="user-name"
              name="name"
              required
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              disabled={saving}
              className={inputClass}
            />
          </Field>

          <Field label="Email" htmlFor="user-email">
            <input
              id="user-email"
              name="email"
              type="email"
              required
              placeholder="jane.doe@vikramaviation.com"
              value={form.email}
              onChange={handleChange}
              disabled={saving}
              className={inputClass}
            />
          </Field>

          <Field label="Role" htmlFor="user-role">
            <select
              id="user-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={saving}
              className={inputClass}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          {editing ? null : (
            <Field label="Initial password" htmlFor="user-password">
              <input
                id="user-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </Field>
          )}

          {error ? <ErrorNote message={error} /> : null}
        </form>
      ) : null}
    </Modal>
  );
}
