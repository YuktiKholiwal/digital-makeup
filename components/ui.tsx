"use client";

import { ReactNode } from "react";

export const inputClass =
  "w-full rounded-[var(--radius-control)] border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none transition-colors duration-200 placeholder:text-ink-faint focus:border-accent focus:bg-white/40";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "quiet" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const variants = {
    primary: "bg-ink text-ground hover:bg-[#463a2d]",
    quiet: "bg-sand text-ink hover:bg-sand-deep",
    ghost: "border border-line bg-transparent text-ink-soft hover:bg-sand hover:text-ink",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-medium transition-all duration-200 [transition-timing-function:var(--ease)] disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all duration-200 [transition-timing-function:var(--ease)] ${
        active
          ? "bg-accent-soft text-ink"
          : "bg-surface text-ink-soft hover:bg-sand hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** A round chip showing a product's colour, or a soft placeholder when it has none. */
export function ShadeDot({ hex, size = 22 }: { hex: string | null; size?: number }) {
  const valid = hex && /^#[0-9a-f]{6}$/i.test(hex);
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: valid ? hex! : "var(--sand-deep)",
        boxShadow: "inset 0 0 0 1px rgb(51 41 31 / 0.08), 0 1px 2px rgb(51 41 31 / 0.08)",
      }}
      title={valid ? hex! : "No shade colour"}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="caps mb-2 block">{label}</span>
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
