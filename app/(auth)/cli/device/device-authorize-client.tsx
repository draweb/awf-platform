"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

export function DeviceAuthorizeClient() {
  const sp = useSearchParams();
  const [userCode, setUserCode] = useState("");
  useEffect(() => {
    const c = sp.get("user_code")?.trim();
    if (c) setUserCode(c);
  }, [sp]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    if (!userCode) return;
    try {
      await navigator.clipboard.writeText(userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: el texto ya es seleccionable */
    }
  }, [userCode]);

  async function authorize() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/device/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_code: userCode }),
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(data.error?.message ?? "No se pudo autorizar");
        return;
      }
      setMessage("Listo. Podés volver a la terminal; el CLI debería completar el login.");
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      {/* Branding header */}
      <div className="p-8 pb-4 flex flex-col items-center border-b border-border">
        <div className="w-10 h-10 mb-4 flex items-center justify-center bg-primary-container rounded-xs shadow-lg border border-white/10">
          <span className="material-symbols-outlined text-white text-2xl">
            devices
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-label)] text-xs text-on-surface uppercase tracking-[0.2em]">
          AWF_DEVICE_AUTH
        </h1>
        <p className="text-on-surface-variant mt-2 text-center text-sm opacity-70">
          Autorización de equipo CLI
        </p>
      </div>

      {/* Authorization area */}
      <div className="p-8 pt-6 flex flex-col gap-6">
        <p className="text-sm text-on-surface-variant text-center">
          Ejecutaste{" "}
          <code className="font-mono text-xs bg-surface-container px-1.5 py-0.5 rounded border border-border">
            awf login
          </code>{" "}
          en tu máquina. Confirmá que el código coincida con el de la terminal.
        </p>

        <Divider text="código de verificación" />

        {/* Code display */}
        <button
          type="button"
          onClick={() => void copyCode()}
          className="group flex items-center justify-center gap-3 rounded-xs border border-border bg-surface-container-low px-4 py-3 transition-all duration-200 hover:border-primary/50 hover:bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary active:scale-[0.99]"
        >
          <span className="font-mono text-2xl tracking-[0.3em] text-on-surface select-all font-semibold">
            {userCode || "————"}
          </span>
          <span className="material-symbols-outlined text-lg text-on-surface-variant group-hover:text-primary transition-colors">
            {copied ? "check" : "content_copy"}
          </span>
        </button>
        {copied && (
          <p className="text-xs text-primary text-center -mt-4">
            Copiado al portapapeles
          </p>
        )}

        {error && <p className="text-sm text-error text-center">{error}</p>}

        {message ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="material-symbols-outlined text-3xl text-emerald-500">
              check_circle
            </span>
            <p className="text-sm text-emerald-400 text-center">{message}</p>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => void authorize()}
            disabled={loading || !userCode.trim()}
            icon={
              <span className="material-symbols-outlined text-sm">
                {loading ? "hourglass_top" : "verified_user"}
              </span>
            }
          >
            {loading ? "Autorizando…" : "Autorizar este equipo"}
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-5 bg-footer/50 border-t border-border flex items-center justify-center">
        <p className="text-on-surface-variant text-xs text-center">
          Este código expira en 15 minutos.
          Si expiró, ejecutá{" "}
          <code className="font-mono text-[10px] text-primary">awf login</code>{" "}
          de nuevo.
        </p>
      </div>
    </GlassCard>
  );
}
