"use client";

import { forwardRef, useState } from "react";

type CopyableTokenProps = {
  value: string;
  /** Texto más pequeño para prefijos en lista */
  compact?: boolean;
  /** Etiqueta accesible para el bloque de valor */
  ariaLabel?: string;
};

export const CopyableToken = forwardRef<HTMLButtonElement, CopyableTokenProps>(function CopyableToken(
  { value, compact, ariaLabel = "Valor a copiar" },
  ref,
) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex gap-2 items-start min-w-0">
      <output
        className={`flex-1 min-w-0 rounded-xs bg-input border border-border px-3 py-2.5 font-mono text-outline break-all leading-relaxed transition-colors duration-200 ${
          compact ? "text-[11px]" : "text-xs sm:text-sm"
        }`}
        aria-label={ariaLabel}
      >
        {value}
      </output>
      <button
        ref={ref}
        type="button"
        onClick={() => void copy()}
        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xs border border-border bg-surface-container-low text-outline hover:text-on-surface hover:bg-surface-container transition-all duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/50"
        aria-label={copied ? "Copiado" : "Copiar"}
      >
        <span className="material-symbols-outlined text-lg">{copied ? "check" : "content_copy"}</span>
      </button>
    </div>
  );
});
