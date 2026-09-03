"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateUser } from "@/store/usersSlice";
import { ROLES, type User, type UserPayload } from "@/types";

export default function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { updating, updateError } = useAppSelector((state) => state.users);

  const [form, setForm] = useState<UserPayload>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "USER",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const result = await dispatch(updateUser({ id: user.id, payload: form }));

    if (updateUser.fulfilled.match(result)) {
      onSaved?.();
      onClose();
    }
  }

  return (
    <Modal
      open={Boolean(user)}
      title="Edit user"
      description="Update this account's name, email and role."
      onClose={onClose}
      size="sm"
      closeDisabled={updating}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={updating}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={updating}>
            {updating ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {user ? (
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name" htmlFor="user-name">
            <input
              id="user-name"
              name="name"
              required
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              disabled={updating}
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
              disabled={updating}
              className={inputClass}
            />
          </Field>

          <Field label="Role" htmlFor="user-role">
            <select
              id="user-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={updating}
              className={inputClass}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          {updateError ? <ErrorNote message={updateError} /> : null}
        </form>
      ) : null}
    </Modal>
  );
}
