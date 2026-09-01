"use client";

import { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder ?? "—"}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        className={`${inputClass} resize-y`}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

/** A round chip showing a product's colour, or a neutral placeholder when it has none. */
export function ShadeDot({ hex, size = 28 }: { hex: string | null; size?: number }) {
  const valid = hex && /^#[0-9a-f]{6}$/i.test(hex);
  return (
    <span
      className="inline-block shrink-0 rounded-full border border-black/10 ring-1 ring-white/40"
      style={{
        width: size,
        height: size,
        background: valid
          ? hex!
          : "repeating-linear-gradient(45deg, var(--surface-2), var(--surface-2) 4px, var(--line) 4px, var(--line) 8px)",
      }}
      title={valid ? hex! : "No shade colour"}
    />
  );
}
