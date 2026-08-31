"use client";

import { Field, inputClass } from "@/components/ui";
import type { CustomerPayload, CustomerType } from "@/types";

export const CUSTOMER_TYPES: CustomerType[] = ["AIRLINE", "MRO", "OEM"];

export const EMPTY_CUSTOMER: CustomerPayload = {
  name: "",
  type: "AIRLINE",
  email: "",
  phone: "",
  address: "",
};

/** Shared by the create form on the list page and the edit form on the detail page. */
export default function CustomerFields({
  value,
  onChange,
  disabled,
  idPrefix = "",
}: {
  value: CustomerPayload;
  onChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const id = (name: string) => `${idPrefix}${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor={id("name")}>
        <input
          id={id("name")}
          name="name"
          required
          placeholder="Air India"
          value={value.name}
          onChange={onChange}
          disabled={disabled}
          className={inputClass}
        />
      </Field>

      <Field label="Type" htmlFor={id("type")}>
        <select
          id={id("type")}
          name="type"
          value={value.type}
          onChange={onChange}
          disabled={disabled}
          className={inputClass}
        >
          {CUSTOMER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Email" htmlFor={id("email")}>
        <input
          id={id("email")}
          name="email"
          type="email"
          required
          placeholder="ops@airindia.com"
          value={value.email}
          onChange={onChange}
          disabled={disabled}
          className={inputClass}
        />
      </Field>

      <Field label="Phone" htmlFor={id("phone")}>
        <input
          id={id("phone")}
          name="phone"
          type="tel"
          required
          placeholder="+911234567890"
          value={value.phone}
          onChange={onChange}
          disabled={disabled}
          className={inputClass}
        />
      </Field>

      <Field label="Address" htmlFor={id("address")} className="sm:col-span-2">
        <textarea
          id={id("address")}
          name="address"
          required
          rows={2}
          placeholder="Terminal 2, Chhatrapati Shivaji Airport, Mumbai"
          value={value.address}
          onChange={onChange}
          disabled={disabled}
          className={inputClass}
        />
      </Field>
    </div>
  );
}
