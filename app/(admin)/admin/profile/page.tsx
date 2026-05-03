"use client";

import { type FormEvent, useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MIN_PASSWORD_LENGTH,
  passwordStrengthScore,
  validateNewPasswordRules,
} from "@/lib/auth/password-policy";

type MeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

type MePayload = {
  user?: MeUser;
  authMethod?: "session" | "pat";
  error?: { message?: string; code?: string };
};

function initialLetter(user: MeUser): string {
  const n = user.name?.trim();
  if (n?.length) return n.slice(0, 1).toUpperCase();
  return user.email?.trim().slice(0, 1).toUpperCase() ?? "?";
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  maintainer: "Mantenedor",
  publisher: "Publicador",
  consumer: "Consumidor",
};

function roleLabel(role: string): string {
  const k = role.toLowerCase();
  return ROLE_LABELS[k] ?? role;
}

const STRENGTH_LABELS = ["—", "Baja", "Aceptable", "Buena", "Fuerte"] as const;

export default function ProfilePage() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [authMethod, setAuthMethod] = useState<"session" | "pat">("session");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/v1/auth/me", { credentials: "include" });
    const j = (await res.json()) as MePayload;
    if (!res.ok) {
      setErr(j.error?.message ?? "Error");
      return;
    }
    setUser(j.user ?? null);
    setAuthMethod(j.authMethod ?? "session");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shell =
    "flex w-full flex-1 flex-col items-center justify-start px-4 py-8 sm:py-10 min-h-0";

  if (err) {
    return (
      <div className={shell}>
        <div className="w-full max-w-md glass-panel rounded-sm p-8 text-center space-y-4 awf-fade-up">
          <span className="material-symbols-outlined text-error text-4xl">error_outline</span>
          <p className="text-sm text-on-surface">{err}</p>
          <Button type="button" variant="primary" className="!w-auto min-w-[200px] mx-auto" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={shell}>
        <div className="flex flex-col items-center gap-3 text-outline text-sm awf-fade-up">
          <span className="material-symbols-outlined text-3xl animate-pulse">hourglass_empty</span>
          <p>Cargando tu perfil…</p>
        </div>
      </div>
    );
  }

  const since = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(user.createdAt),
  );

  return (
    <div className={shell}>
      <div className="w-full max-w-2xl space-y-6">
        <section
          className="glass-panel rounded-sm overflow-hidden border border-border-strong shadow-2xl transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] awf-fade-up"
          aria-labelledby="account-card-title"
        >
          <div className="px-5 sm:px-6 pt-6 sm:pt-7 pb-5 border-b border-border bg-gradient-to-b from-primary-container/10 via-transparent to-transparent">
            <h2 id="account-card-title" className="sr-only">
              Cuenta
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
              <div
                className="shrink-0 w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full bg-primary-container flex items-center justify-center text-2xl font-bold text-white shadow-lg border border-white/10 transition-transform duration-300 hover:scale-[1.02]"
                aria-hidden
              >
                {initialLetter(user)}
              </div>
              <div className="min-w-0 flex-1 text-left space-y-1.5">
                <p className="text-lg sm:text-xl font-semibold text-on-surface tracking-tight truncate">{user.name}</p>
                <p className="text-sm text-on-surface-variant truncate">{user.email}</p>
                <span className="inline-flex items-center rounded-full border border-border bg-surface-container-low px-3 py-1 text-[11px] font-[family-name:var(--font-label)] uppercase tracking-wider text-primary">
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-5 text-left">
            <p className="text-xs text-outline leading-relaxed">
              Datos de solo lectura correspondientes a tu sesión actual en AWF.
            </p>

            <ProfileRow icon="calendar_month" label="Miembro desde" value={since} />

            <div className="pt-1 border-t border-border">
              <p className="text-[10px] font-[family-name:var(--font-label)] uppercase tracking-wider text-outline mb-2">
                Identificador técnico
              </p>
              <TechnicalIdBlock id={user.id} />
            </div>
          </div>
        </section>

        {authMethod === "session" ? (
          <PasswordChangeCard onPasswordChanged={() => void load()} />
        ) : (
          <section
            className="glass-panel rounded-sm border border-border-strong px-5 sm:px-6 py-6 text-left awf-fade-up awf-fade-up-delay"
            aria-live="polite"
          >
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-outline shrink-0">vpn_key_off</span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-on-surface">Cambio de contraseña no disponible</p>
                <p className="text-xs text-outline leading-relaxed">
                  Estás autenticado con un token de acceso (CLI). Para cambiar la contraseña, iniciá sesión en el panel con email y contraseña.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2">
      <span className="material-symbols-outlined text-outline shrink-0 mt-0.5 text-xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-[family-name:var(--font-label)] uppercase tracking-wider text-outline">{label}</p>
        <p className="mt-0.5 text-sm text-on-surface break-words">{value}</p>
      </div>
    </div>
  );
}

function TechnicalIdBlock({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex gap-2 items-start">
      <output
        className="flex-1 min-w-0 rounded-xs bg-input border border-border px-3 py-2.5 font-mono text-[11px] text-outline break-all leading-relaxed transition-colors duration-200"
        aria-label="Identificador técnico"
      >
        {id}
      </output>
      <button
        type="button"
        onClick={() => void copy()}
        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xs border border-border bg-surface-container-low text-outline hover:text-on-surface hover:bg-surface-container transition-all duration-200 active:scale-[0.97]"
        aria-label={copied ? "Copiado" : "Copiar identificador"}
      >
        <span className="material-symbols-outlined text-lg">{copied ? "check" : "content_copy"}</span>
      </button>
    </div>
  );
}

function PasswordChangeCard({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  const baseId = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ c: false, n: false, f: false });
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const strength = passwordStrengthScore(next);
  const localErr =
    confirm.length > 0 && next !== confirm ? "Las contraseñas nuevas no coinciden." : null;
  const rulesErr = next.length > 0 ? validateNewPasswordRules(next, current) : null;

  const canSubmit =
    current.length > 0 &&
    next.length > 0 &&
    confirm.length > 0 &&
    next === confirm &&
    !rulesErr &&
    !busy;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setOkMsg(null);
    const v = validateNewPasswordRules(next, current);
    if (v) {
      setFormErr(v);
      return;
    }
    if (next !== confirm) {
      setFormErr("Las contraseñas nuevas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok) {
        setFormErr(j.error?.message ?? "No se pudo actualizar la contraseña.");
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setOkMsg("Contraseña actualizada. El resto de tus sesiones en el panel se cerraron por seguridad.");
      onPasswordChanged();
      window.setTimeout(() => setOkMsg(null), 7000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="glass-panel rounded-sm overflow-hidden border border-border-strong shadow-2xl transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] awf-fade-up awf-fade-up-delay awf-focus-ring"
      aria-labelledby="password-card-title"
    >
      <header className="px-5 sm:px-6 pt-6 pb-4 border-b border-border bg-gradient-to-b from-surface-container-low/40 to-transparent">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary-container shrink-0 mt-0.5" aria-hidden>
            lock_reset
          </span>
          <div>
            <h2 id="password-card-title" className="text-base font-semibold text-on-surface">
              Seguridad de la cuenta
            </h2>
            <p className="mt-1 text-xs text-outline leading-relaxed">
              Cambiá tu contraseña del panel. Se recomienda al menos {MIN_PASSWORD_LENGTH} caracteres, con letras y números.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={(e) => void onSubmit(e)} className="px-5 sm:px-6 py-6 space-y-5 text-left">
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${okMsg ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}
          aria-live="polite"
        >
          {okMsg ? (
            <div className="rounded-xs border border-primary-container/40 bg-primary-container/15 px-3 py-2.5 text-xs text-on-surface flex gap-2 items-start">
              <span className="material-symbols-outlined text-primary-container text-lg shrink-0">check_circle</span>
              <span>{okMsg}</span>
            </div>
          ) : null}
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${formErr ? "max-h-28 opacity-100" : "max-h-0 opacity-0"}`}
          role="alert"
        >
          {formErr ? (
            <div className="rounded-xs border border-error/50 bg-error/10 px-3 py-2.5 text-xs text-error flex gap-2 items-start">
              <span className="material-symbols-outlined text-lg shrink-0">error</span>
              <span>{formErr}</span>
            </div>
          ) : null}
        </div>

        <PasswordInput
          id={`${baseId}-current`}
          label="Contraseña actual"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          visible={show.c}
          onToggleVisible={() => setShow((s) => ({ ...s, c: !s.c }))}
        />

        <div className="space-y-2">
          <PasswordInput
            id={`${baseId}-next`}
            label="Nueva contraseña"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            visible={show.n}
            onToggleVisible={() => setShow((s) => ({ ...s, n: !s.n }))}
          />
          {next.length > 0 ? (
            <div className="space-y-1.5 pl-0.5 transition-opacity duration-200">
              <div className="flex gap-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      strength > i ? "bg-primary-container" : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-outline">
                Fuerza: <span className="text-on-surface-variant">{STRENGTH_LABELS[strength]}</span>
              </p>
            </div>
          ) : null}
        </div>

        <PasswordInput
          id={`${baseId}-confirm`}
          label="Confirmar nueva contraseña"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          visible={show.f}
          onToggleVisible={() => setShow((s) => ({ ...s, f: !s.f }))}
        />

        {localErr ? (
          <p className="text-xs text-error transition-opacity duration-200" role="status">
            {localErr}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          className="!w-full sm:!w-auto sm:min-w-[220px] transition-transform duration-200"
          icon={<span className="material-symbols-outlined text-base">shield_lock</span>}
        >
          {busy ? "Guardando…" : "Actualizar contraseña"}
        </Button>
      </form>
    </section>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider pl-1"
      >
        {label}
      </label>
      <div className="relative group">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-input border border-border rounded-sm text-sm text-on-surface pr-11 pl-3 py-2
            focus:outline-none focus:ring-0 focus:border-primary-container transition-colors duration-200
            placeholder:text-outline/40"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xs text-outline
            hover:text-on-surface hover:bg-surface-container-high/80 transition-colors duration-200"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <span className="material-symbols-outlined text-xl">{visible ? "visibility_off" : "visibility"}</span>
        </button>
      </div>
    </div>
  );
}
