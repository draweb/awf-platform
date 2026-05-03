"use client";

import { type FormEvent, type KeyboardEvent, useId, useState } from "react";

type TagInputProps = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
  disabled?: boolean;
};

export function TagInput({ label, value, onChange, suggestions = [], placeholder = "Escribí y Enter", disabled }: TagInputProps) {
  const id = useId();
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    setDraft("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    addTag(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider pl-1">
        {label}
      </label>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2 bg-input border border-border rounded-sm">
          {value.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-surface-container-low border border-border text-[11px] font-mono text-on-surface"
            >
              {t}
              {!disabled && (
                <button
                  type="button"
                  className="text-outline hover:text-error-container text-xs leading-none"
                  aria-label={`Quitar ${t}`}
                  onClick={() => onChange(value.filter((x) => x !== t))}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          <input
            id={id}
            disabled={disabled}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm font-mono text-on-surface placeholder:text-outline/40"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions
              .filter((s) => !value.includes(s))
              .slice(0, 12)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  className="text-[10px] px-2 py-0.5 rounded-xs border border-border text-outline hover:text-on-surface hover:bg-footer disabled:opacity-50"
                  onClick={() => addTag(s)}
                >
                  + {s}
                </button>
              ))}
          </div>
        )}
      </form>
    </div>
  );
}
