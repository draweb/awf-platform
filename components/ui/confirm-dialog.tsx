"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type ConfirmDialogTone = "primary" | "danger";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  /** Si true, el botón confirmar muestra estado de carga */
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "primary",
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDialogClose = () => {
      onClose();
    };
    el.addEventListener("close", onDialogClose);
    return () => el.removeEventListener("close", onDialogClose);
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    }
    if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] max-w-md w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border-strong bg-surface-container p-0 text-on-surface shadow-2xl [&::backdrop]:bg-black/65 [&::backdrop]:backdrop-blur-[2px]"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-2 text-sm text-outline leading-relaxed">{description}</p> : null}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 bg-surface-container-low/40">
        <Button type="button" variant="ghost" className="!w-full sm:!w-auto sm:min-w-[100px]" disabled={pending} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "danger" : "primary"}
          className="!w-full sm:!w-auto sm:min-w-[120px]"
          disabled={pending}
          onClick={() => void onConfirm()}
        >
          {pending ? "…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
