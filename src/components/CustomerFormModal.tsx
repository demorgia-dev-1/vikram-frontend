"use client";

import { useState } from "react";
import CustomerFields, { EMPTY_CUSTOMER } from "@/components/CustomerFields";
import Modal from "@/components/Modal";
import { Button, ErrorNote } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store";
import { createCustomer, updateCustomer } from "@/store/customersSlice";
import type { Customer, CustomerPayload } from "@/types";

function toPayload(customer: Customer): CustomerPayload {
  return {
    name: customer.name,
    type: customer.type,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
  };
}

/** One dialog for both create and edit; `customer` decides which. */
export default function CustomerFormModal({
  open,
  customer,
  onClose,
  onSaved,
}: {
  open: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { creating, createError, updating, updateError } = useAppSelector(
    (state) => state.customers,
  );

  const editing = Boolean(customer);
  const [form, setForm] = useState<CustomerPayload>(
    customer ? toPayload(customer) : EMPTY_CUSTOMER,
  );

  const saving = editing ? updating : creating;
  const error = editing ? updateError : createError;

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = customer
      ? await dispatch(updateCustomer({ id: customer.id, payload: form }))
      : await dispatch(createCustomer(form));

    const ok = customer
      ? updateCustomer.fulfilled.match(result)
      : createCustomer.fulfilled.match(result);

    if (ok) {
      onSaved?.();
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? "Edit customer" : "New customer"}
      description={
        editing
          ? "Update the customer's contact and address details."
          : "Register an airline, MRO or OEM on the portal."
      }
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create customer"}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit}>
        <CustomerFields
          value={form}
          onChange={handleChange}
          disabled={saving}
          idPrefix={editing ? "edit-" : "new-"}
        />

        {error ? (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
