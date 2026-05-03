"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Variant = "error" | "success" | "warning";

type AlertPayload = { id: number; variant: Variant; message: string };

export type AlertContextValue = {
  showAlert: (variant: Variant, message: string) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  dismiss: () => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const DURATION_MS: Record<Variant, number> = {
  error: 9000,
  success: 4500,
  warning: 7000,
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<AlertPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const showAlert = useCallback(
    (variant: Variant, message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const id = Date.now();
      setToast({ id, variant, message });
      timerRef.current = setTimeout(dismiss, DURATION_MS[variant]);
    },
    [dismiss],
  );

  const showError = useCallback((m: string) => showAlert("error", m), [showAlert]);
  const showSuccess = useCallback((m: string) => showAlert("success", m), [showAlert]);
  const showWarning = useCallback((m: string) => showAlert("warning", m), [showAlert]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const icon =
    toast?.variant === "success" ? "check_circle" : toast?.variant === "warning" ? "warning" : "error";

  const surface =
    toast?.variant === "success"
      ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-50"
      : toast?.variant === "warning"
        ? "border-amber-500/45 bg-amber-950/90 text-amber-50"
        : "border-error-container/50 bg-surface-container-high text-on-error-container shadow-[0_0_0_1px_rgba(255,255,255,0.06)]";

  return (
    <AlertContext.Provider value={{ showAlert, showError, showSuccess, showWarning, dismiss }}>
      {children}
      {toast ? (
        <div
          role="alert"
          aria-live="assertive"
          className="pointer-events-auto fixed bottom-6 right-6 z-[200] flex max-w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        >
          <div
            className={`flex w-full gap-3 rounded-md border px-4 py-3 shadow-2xl backdrop-blur-md transition-opacity duration-200 ${surface}`}
          >
            <span className="material-symbols-outlined shrink-0 text-[22px] opacity-95">{icon}</span>
            <p className="min-w-0 flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 opacity-75 hover:opacity-100"
              onClick={dismiss}
              aria-label="Cerrar alerta"
            >
              <span className="material-symbols-outlined !text-[18px]">close</span>
            </button>
          </div>
        </div>
      ) : null}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert debe usarse dentro de AlertProvider");
  }
  return ctx;
}
