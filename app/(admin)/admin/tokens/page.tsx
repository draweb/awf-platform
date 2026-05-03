"use client";

import { type FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyableToken } from "@/components/ui/copyable-token";
import { InputField } from "@/components/ui/input-field";
import { EXPIRY_PRESETS_DAYS, expiryFromPresetDays } from "@/lib/auth/pat-policy";
import { SCOPE_DESCRIPTIONS } from "@/lib/auth/scopes-catalog";
import type { Scope } from "@/lib/auth/scopes";
import { SCOPES } from "@/lib/auth/scopes";

const DEFAULT_SCOPES: Scope[] = ["artifact:read", "artifact:publish"];

type PatItem = {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type ExpiryChoice = "never" | (typeof EXPIRY_PRESETS_DAYS)[number];

function relativeTimeEs(iso: string | null): string {
  if (!iso) return "Nunca usado";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (sec < 60) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const h = Math.round(min / 60);
  if (h < 48) return rtf.format(-h, "hour");
  const d = Math.round(h / 24);
  if (d < 60) return rtf.format(-d, "day");
  const mo = Math.round(d / 30);
  return rtf.format(-mo, "month");
}

function formatDate(iso: string | null): string {
  if (!iso) return "Sin expiración";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export default function PatTokensPage() {
  const formId = useId();
  const [items, setItems] = useState<PatItem[]>([]);
  const [availableScopes, setAvailableScopes] = useState<string[]>([...SCOPES]);
  const [listErr, setListErr] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  const [name, setName] = useState("CLI local");
  const [selectedScopes, setSelectedScopes] = useState<Set<Scope>>(() => new Set(DEFAULT_SCOPES));
  const [expiry, setExpiry] = useState<ExpiryChoice>("never");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);

  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokePending, setRevokePending] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const [renamePat, setRenamePat] = useState<PatItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const renameDialogRef = useRef<HTMLDialogElement>(null);
  const copyNewTokenBtnRef = useRef<HTMLButtonElement>(null);
  const tokenRevealRef = useRef<HTMLDivElement>(null);

  const [adminWriteConfirmOpen, setAdminWriteConfirmOpen] = useState(false);

  const clearCreateErr = useCallback(() => setCreateErr(null), []);

  const loadList = useCallback(async () => {
    setListErr(null);
    const res = await fetch("/api/v1/user/personal-access-tokens", { credentials: "include" });
    const j = (await res.json()) as {
      items?: PatItem[];
      availableScopes?: string[];
      error?: { message?: string };
    };
    if (!res.ok) {
      setListErr(j.error?.message ?? "Error al cargar tokens");
      return;
    }
    setItems(j.items ?? []);
    if (j.availableScopes?.length) setAvailableScopes(j.availableScopes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      await loadList();
      if (!cancelled) setLoadingList(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadList]);

  useEffect(() => {
    const el = renameDialogRef.current;
    if (!el) return;
    if (renamePat && !el.open) {
      el.showModal();
    }
    if (!renamePat && el.open) {
      el.close();
    }
  }, [renamePat]);

  useEffect(() => {
    const el = renameDialogRef.current;
    if (!el) return;
    const onClose = () => {
      setRenamePat(null);
      setRenameBusy(false);
    };
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, []);

  useEffect(() => {
    if (!newToken) return;
    tokenRevealRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const t = window.setTimeout(() => copyNewTokenBtnRef.current?.focus(), 400);
    return () => window.clearTimeout(t);
  }, [newToken]);

  function toggleScope(s: Scope, checked: boolean) {
    if (s === "admin:write" && checked) {
      setAdminWriteConfirmOpen(true);
      return;
    }
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(s);
      else next.delete(s);
      if (next.size === 0) return prev;
      return next;
    });
  }

  function confirmAdminWrite() {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      next.add("admin:write");
      return next;
    });
    setAdminWriteConfirmOpen(false);
  }

  function cancelAdminWrite() {
    setAdminWriteConfirmOpen(false);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreateErr(null);
    setNewToken(null);
    const scopes = [...selectedScopes];
    const expiresAt =
      expiry === "never" ? null : expiryFromPresetDays(expiry).toISOString();
    setCreating(true);
    try {
      const res = await fetch("/api/v1/user/personal-access-tokens", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scopes, expiresAt }),
      });
      const j = (await res.json()) as {
        token?: string;
        id?: string;
        name?: string;
        scopes?: string[];
        createdAt?: string;
        expiresAt?: string | null;
        tokenPrefix?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setCreateErr(j.error?.message ?? "Error al crear token");
        return;
      }
      if (j.token) setNewToken(j.token);
      if (j.id && j.name && j.scopes && j.createdAt) {
        setItems((prev) => [
          {
            id: j.id!,
            name: j.name!,
            tokenPrefix: j.tokenPrefix ?? "",
            scopes: j.scopes!,
            lastUsedAt: null,
            expiresAt: j.expiresAt ?? null,
            createdAt: j.createdAt!,
          },
          ...prev,
        ]);
      } else {
        await loadList();
      }
    } finally {
      setCreating(false);
    }
  }

  async function doRevoke(id: string) {
    setRevokePending(true);
    const prev = items;
    setItems((list) => list.filter((x) => x.id !== id));
    setRemovingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/v1/user/personal-access-tokens/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: { message?: string } };
        setItems(prev);
        setCreateErr(j.error?.message ?? "No se pudo revocar");
        setRevokeId(null);
        return;
      }
      setRevokeId(null);
    } finally {
      setRevokePending(false);
      setRemovingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  async function saveRename() {
    if (!renamePat) return;
    setRenameBusy(true);
    try {
      const res = await fetch(`/api/v1/user/personal-access-tokens/${encodeURIComponent(renamePat.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      const j = (await res.json()) as { item?: PatItem; error?: { message?: string } };
      if (!res.ok) {
        setCreateErr(j.error?.message ?? "No se pudo renombrar");
        return;
      }
      if (j.item) {
        setItems((list) => list.map((x) => (x.id === j.item!.id ? { ...x, ...j.item! } : x)));
      }
      renameDialogRef.current?.close();
      setRenamePat(null);
    } finally {
      setRenameBusy(false);
    }
  }

  const shell = "flex w-full flex-1 flex-col items-stretch min-h-0";

  return (
    <div className={shell}>
      <div className="w-full max-w-3xl mx-auto space-y-6 px-0 pb-10 sm:pb-12">
        <header className="awf-fade-up">
          <h1 className="text-lg font-semibold text-on-surface tracking-tight">Tokens de acceso personal</h1>
          <p className="mt-1.5 text-sm text-outline leading-relaxed max-w-2xl">
            Usalos con el CLI <code className="text-on-surface-variant">awf</code> en{" "}
            <code className="text-on-surface-variant">Authorization: Bearer</code>. El valor completo del token solo se muestra una vez al
            crearlo; para más permisos, creá un token nuevo y revocá el anterior.
          </p>
        </header>

        <section
          className="glass-panel rounded-sm overflow-hidden border border-border-strong shadow-2xl transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] awf-fade-up"
          aria-labelledby="pat-list-title"
        >
          <div className="px-5 sm:px-6 pt-6 pb-4 border-b border-border bg-gradient-to-b from-primary-container/8 via-transparent to-transparent flex items-start gap-3">
            <span className="material-symbols-outlined text-primary-container shrink-0 mt-0.5" aria-hidden>
              key
            </span>
            <div>
              <h2 id="pat-list-title" className="text-base font-semibold text-on-surface">
                Tus tokens
              </h2>
              <p className="mt-1 text-xs text-outline leading-relaxed">
                Prefijo visible y scopes. Revocar invalida el acceso inmediatamente.
              </p>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5">
            {loadingList ? (
              <p className="text-sm text-outline flex items-center gap-2">
                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                Cargando…
              </p>
            ) : listErr ? (
              <div className="rounded-xs border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{listErr}</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10 px-4 rounded-xs border border-dashed border-border bg-surface-container-low/30">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">vpn_key</span>
                <p className="text-sm text-on-surface font-medium">Aún no creaste tokens</p>
                <p className="text-xs text-outline mt-1 max-w-sm">
                  Creá uno abajo para usar el CLI contra este registry.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((row) => (
                  <li
                    key={row.id}
                    className={`rounded-xs border border-border bg-surface-container-low/25 p-4 transition-opacity duration-300 ${
                      removingIds.has(row.id) ? "opacity-40 pointer-events-none" : "opacity-100"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-sm font-medium text-on-surface">{row.name}</p>
                        <CopyableToken value={row.tokenPrefix} compact ariaLabel="Prefijo del token" />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {row.scopes.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center rounded-full border border-border bg-input px-2 py-0.5 text-[10px] font-mono text-on-surface-variant"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-outline">
                          Último uso: <span className="text-on-surface-variant">{relativeTimeEs(row.lastUsedAt)}</span>
                          {" · "}
                          Expira: <span className="text-on-surface-variant">{formatDate(row.expiresAt)}</span>
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          className="!w-auto min-w-0 px-3 h-9 text-xs"
                          onClick={() => {
                            setRenamePat(row);
                            setRenameValue(row.name);
                          }}
                        >
                          Renombrar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="!w-auto min-w-0 px-3 h-9 text-xs text-error hover:border-error/40"
                          onClick={() => setRevokeId(row.id)}
                        >
                          Revocar
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          className="glass-panel rounded-sm overflow-hidden border border-border-strong shadow-2xl transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] awf-fade-up awf-fade-up-delay awf-focus-ring"
          aria-labelledby="pat-create-title"
        >
          <div className="px-5 sm:px-6 pt-6 pb-4 border-b border-border bg-gradient-to-b from-surface-container-low/40 to-transparent flex items-start gap-3">
            <span className="material-symbols-outlined text-primary-container shrink-0 mt-0.5" aria-hidden>
              add_moderator
            </span>
            <div>
              <h2 id="pat-create-title" className="text-base font-semibold text-on-surface">
                Nuevo token
              </h2>
              <p className="mt-1 text-xs text-outline leading-relaxed">
                Los scopes no se pueden editar después: para cambiarlos, revocá y creá otro token.
              </p>
            </div>
          </div>

          <form
            id={formId}
            onSubmit={(e) => void onCreate(e)}
            className="px-5 sm:px-6 pt-6 pb-8 sm:pb-10 space-y-5 text-left"
          >
            {createErr ? (
              <div className="rounded-xs border border-error/40 bg-error/10 px-3 py-2 text-sm text-error" role="alert">
                {createErr}
              </div>
            ) : null}

            <InputField
              label="Nombre"
              value={name}
              onChange={(e) => {
                clearCreateErr();
                setName(e.target.value);
              }}
              className="!font-sans"
              autoComplete="off"
            />

            <fieldset className="space-y-3 border-0 p-0 m-0">
              <legend className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider pl-1 mb-2">
                Scopes
              </legend>
              <p id={`${formId}-scopes-hint`} className="text-[11px] text-outline pl-1 -mt-1 mb-2 leading-snug">
                Seleccioná al menos uno. Los IDs en violeta son los que envía el CLI en cada petición.
              </p>
              <div className="space-y-2.5" role="group" aria-describedby={`${formId}-scopes-hint`}>
                {availableScopes.map((raw) => {
                  const s = raw as Scope;
                  const meta = SCOPE_DESCRIPTIONS[s];
                  if (!meta) return null;
                  const checked = selectedScopes.has(s);
                  const rowSel = checked
                    ? meta.danger
                      ? "border-error/40 bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-error)_35%,transparent)]"
                      : "border-primary-container/45 bg-primary-container/[0.09] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary-container)_25%,transparent)]"
                    : "border-border/80 bg-input/35 hover:bg-input/70 hover:border-border-strong";
                  return (
                    <label
                      key={s}
                      className={`flex gap-3 cursor-pointer rounded-xs border px-3 py-2.5 transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-container/35 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[var(--color-background)] ${rowSel}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(e) => {
                          clearCreateErr();
                          toggleScope(s, e.target.checked);
                        }}
                      />
                      <span
                        className={`relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border transition-colors duration-200 ${
                          checked
                            ? meta.danger
                              ? "border-error bg-error"
                              : "border-primary-container bg-primary-container"
                            : "border-border bg-[var(--color-input)]"
                        }`}
                        aria-hidden
                      >
                        <span
                          className={`material-symbols-outlined text-[14px] leading-none text-white transition-opacity duration-200 select-none ${
                            checked ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          check
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono text-primary">{s}</span>
                          {meta.danger ? (
                            <span className="text-[10px] uppercase tracking-wider text-error border border-error/45 rounded-full px-2 py-0.5 bg-error/[0.08]">
                              Peligroso
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-[11px] text-outline mt-0.5 leading-snug">{meta.label}</span>
                        <span className="block text-[11px] text-on-surface-variant mt-0.5 leading-snug">{meta.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Ritmo: mismo gap label→control que InputField (gap-2); aire superior tras scopes vía borde + pt */}
            <div className="flex flex-col gap-2 border-t border-border/55 pt-5">
              <label
                htmlFor={`${formId}-expiry`}
                className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider pl-1"
              >
                Expiración
              </label>
              <select
                id={`${formId}-expiry`}
                value={String(expiry)}
                onChange={(e) => {
                  clearCreateErr();
                  const v = e.target.value;
                  if (v === "never") setExpiry("never");
                  else setExpiry(Number(v) as (typeof EXPIRY_PRESETS_DAYS)[number]);
                }}
                className="w-full min-h-10 cursor-pointer appearance-none bg-input border border-border rounded-sm text-sm text-on-surface px-3 py-2 pr-10 bg-[length:1.25rem] bg-[right_0.65rem_center] bg-no-repeat transition-colors hover:border-border-strong focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23918f9f'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                }}
              >
                <option value="never">No expira</option>
                {EXPIRY_PRESETS_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d} días
                  </option>
                ))}
              </select>
            </div>

            {newToken ? (
              <div
                ref={tokenRevealRef}
                id="pat-token-reveal"
                tabIndex={-1}
                className="rounded-xs border border-tertiary-container/50 bg-tertiary-container/10 p-4 space-y-3 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary-container/40"
              >
                <p className="text-xs font-medium text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary-container text-lg shrink-0">warning</span>
                  Guardá este token ahora; no se vuelve a mostrar completo.
                </p>
                <CopyableToken ref={copyNewTokenBtnRef} value={newToken} ariaLabel="Token personal completo" />
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={creating || selectedScopes.size === 0}
              className="!w-full sm:!w-auto sm:min-w-[200px]"
              icon={
                <span className={`material-symbols-outlined text-base ${creating ? "animate-spin" : ""}`}>
                  {creating ? "progress_activity" : "shield_lock"}
                </span>
              }
            >
              {creating ? "Creando…" : "Crear token"}
            </Button>
          </form>
        </section>
      </div>

      <ConfirmDialog
        open={revokeId !== null}
        onClose={() => {
          if (!revokePending) setRevokeId(null);
        }}
        title="¿Revocar este token?"
        description="El CLI y cualquier script que lo use dejarán de funcionar de inmediato."
        confirmLabel="Revocar"
        tone="danger"
        pending={revokePending}
        onConfirm={async () => {
          if (revokeId) await doRevoke(revokeId);
        }}
      />

      <ConfirmDialog
        open={adminWriteConfirmOpen}
        onClose={cancelAdminWrite}
        title="Scope admin:write"
        description="Otorga acceso administrativo amplio al registry, equivalente a bypass de otros scopes. Solo activalo si confiás en el entorno donde guardarás el token."
        confirmLabel="Sí, habilitar"
        tone="danger"
        onConfirm={() => confirmAdminWrite()}
      />

      <dialog
        ref={renameDialogRef}
        className="fixed left-1/2 top-1/2 z-50 max-w-md w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border-strong bg-surface-container p-0 text-on-surface shadow-2xl [&::backdrop]:bg-black/65 [&::backdrop]:backdrop-blur-[2px]"
        onCancel={(e) => {
          e.preventDefault();
          renameDialogRef.current?.close();
        }}
      >
        {renamePat ? (
          <form
            className="p-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveRename();
            }}
          >
            <h2 className="text-base font-semibold">Renombrar token</h2>
            <InputField label="Nombre" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" className="!w-full sm:!w-auto" onClick={() => renameDialogRef.current?.close()}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="!w-full sm:!w-auto" disabled={renameBusy || !renameValue.trim()}>
                {renameBusy ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
