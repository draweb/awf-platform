"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAlert } from "@/components/ui/alert-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Item = {
  id: string;
  slug: string;
  name: string;
  description: string;
  semver: string;
  status: "draft" | "active" | "archived";
  stacks: string[];
  updatedAt: string;
  artifactCount: number;
};

function relativeTimeEs(iso: string): string {
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
  return rtf.format(-d, "day");
}

const statusColor: Record<string, string> = {
  draft: "bg-outline",
  active: "bg-emerald-500",
  archived: "bg-error-container",
};

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  active: "RUNNING",
  archived: "ARCHIVED",
};

type StatusChip = "all" | "draft" | "active" | "archived";

export default function WorkspacesPage() {
  const { showError } = useAlert();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusChip>("all");
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const load = useCallback(async () => {
    setListError(false);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/v1/workspaces?${params.toString()}`, { credentials: "include" });
    const j = (await res.json()) as {
      items?: Item[];
      error?: { message?: string; code?: string };
    };
    if (!res.ok) {
      setListError(true);
      const base = j.error?.message ?? "No se pudo cargar la lista de workspaces.";
      const meta = [j.error?.code, res.status ? `HTTP ${res.status}` : ""].filter(Boolean).join(" · ");
      showError(meta ? `${base} (${meta})` : base);
      setItems([]);
      return;
    }
    setItems(j.items ?? []);
  }, [statusFilter, showError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  async function downloadJson(id: string) {
    const res = await fetch(`/api/v1/workspaces/${id}/awf-workspace.json`, { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "awf.workspace.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/v1/workspaces/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: string } };
    setDeleting(false);
    if (res.ok) {
      setDeleteTarget(null);
      await load();
    } else {
      showError(j.error?.message ?? "No se pudo eliminar el workspace.");
    }
  }

  const filteredLocal = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => i.name.toLowerCase().includes(s) || i.slug.toLowerCase().includes(s));
  }, [items, q]);

  const chipClasses = (chip: StatusChip) =>
    `px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
      statusFilter === chip
        ? "bg-primary-container/20 text-primary border-primary-container/50"
        : "bg-transparent text-outline border-border hover:border-border-strong"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-label)] text-base font-bold text-on-surface tracking-tight">Workspace Manager</h1>
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline !text-[16px]">search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nombre o slug…"
              className="pl-8 pr-3 h-8 w-56 bg-footer border border-border rounded text-[11px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded overflow-hidden">
            <button
              type="button"
              className={`p-1.5 ${viewMode === "grid" ? "bg-footer text-on-surface" : "text-outline hover:bg-footer"}`}
              onClick={() => setViewMode("grid")}
            >
              <span className="material-symbols-outlined !text-[16px]">grid_view</span>
            </button>
            <button
              type="button"
              className={`p-1.5 ${viewMode === "list" ? "bg-footer text-on-surface" : "text-outline hover:bg-footer"}`}
              onClick={() => setViewMode("list")}
            >
              <span className="material-symbols-outlined !text-[16px]">list</span>
            </button>
          </div>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <Link href="/admin/workspaces/new">
            <button
              type="button"
              className="flex items-center gap-1.5 h-8 px-3 bg-primary-container text-white rounded text-[10px] font-bold font-[family-name:var(--font-label)] uppercase tracking-wider hover:bg-primary-container/80 transition-colors"
            >
              <span className="material-symbols-outlined !text-[14px]">add</span>
              Nuevo workspace
            </button>
          </Link>
        </div>
      </header>

      {/* Chip row */}
      <div className="px-4 md:px-6 py-2 flex items-center gap-2 border-b border-border/50 shrink-0">
        <button type="button" className={chipClasses("all")} onClick={() => setStatusFilter("all")}>Todos</button>
        {(["draft", "active", "archived"] as const).map((s) => (
          <button key={s} type="button" className={chipClasses(s)} onClick={() => setStatusFilter(s)}>
            <span className={`dot-status ${statusColor[s]} mr-1`} />
            {statusLabel[s]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto ws-scrollbar p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-outline">
            <span className="material-symbols-outlined animate-spin !text-[28px]">progress_activity</span>
            <p className="text-sm font-mono">Cargando workspaces…</p>
          </div>
        ) : listError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-4">
            <p className="max-w-sm text-center text-sm text-outline">
              No se pudo cargar la lista. El detalle apareció en la alerta inferior derecha.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void (async () => {
                  await load();
                  setLoading(false);
                })();
              }}
              className="inline-flex items-center gap-1.5 rounded border border-border-strong bg-footer px-4 py-2 text-[11px] font-medium text-on-surface hover:border-primary-container/40 hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined !text-[16px]">refresh</span>
              Reintentar
            </button>
          </div>
        ) : filteredLocal.length === 0 ? (
          items.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-5 py-16 text-center md:py-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-footer shadow-inner">
                <span className="material-symbols-outlined text-primary-container !text-[40px]">deployed_code</span>
              </div>
              <div className="space-y-2">
                <p className="font-[family-name:var(--font-label)] text-base font-bold tracking-tight text-on-surface">
                  Todavía no hay workspaces
                </p>
                <p className="text-sm leading-relaxed text-outline">
                  Un workspace agrupa la constitución del agente (Markdown), stacks autorizados y artefactos del registry con versión fijada — todo versionable desde AWF.
                </p>
              </div>
              <ul className="w-full space-y-2 rounded-lg border border-border/80 bg-footer/50 px-4 py-3 text-left text-[11px] text-outline">
                <li className="flex gap-2">
                  <span className="material-symbols-outlined shrink-0 !text-[16px] text-primary-container">check_small</span>
                  Definí identidad, stacks y bloques constitucionales en el editor.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined shrink-0 !text-[16px] text-primary-container">check_small</span>
                  Enlazá paquetes del registry con versión pinnada.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined shrink-0 !text-[16px] text-primary-container">check_small</span>
                  Exportá <span className="font-mono text-[10px] text-on-surface">awf.workspace.json</span> para reproducir el entorno.
                </li>
              </ul>
              <Link href="/admin/workspaces/new">
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded bg-primary-container px-5 text-[11px] font-bold font-[family-name:var(--font-label)] uppercase tracking-wider text-white transition-colors hover:bg-primary-container/85"
                >
                  <span className="material-symbols-outlined !text-[18px]">add</span>
                  Crear primer workspace
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <span className="material-symbols-outlined text-outline !text-[40px]">search_off</span>
              <p className="text-sm text-on-surface">Ningún workspace coincide con la búsqueda</p>
              <button
                type="button"
                onClick={() => setQ("")}
                className="text-[11px] font-medium text-primary-container underline-offset-2 hover:underline"
              >
                Limpiar filtro
              </button>
            </div>
          )
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2"}>
            {filteredLocal.map((w) => (
              <article
                key={w.id}
                className="group p-4 bg-footer border border-border rounded hover:border-primary-container/40 transition-all"
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded bg-input flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-container !text-[16px]">deployed_code</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-on-surface truncate">{w.name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`dot-status ${statusColor[w.status]}`} />
                        <span className="label-xs-uppercase text-outline">{statusLabel[w.status]}</span>
                      </div>
                    </div>
                    <code className="text-[10px] font-mono text-outline block truncate">{w.slug}</code>
                  </div>
                </div>

                {/* Body */}
                <div className="mt-3 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Versión</span>
                    <span className="font-mono text-on-surface">{w.semver}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Stacks</span>
                    <div className="flex items-center gap-1">
                      {w.stacks.slice(0, 3).map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-surface-container-low border border-border text-[9px] font-mono text-on-surface">
                          {s}
                        </span>
                      ))}
                      {w.stacks.length > 3 && (
                        <span className="text-[9px] text-outline">+{w.stacks.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-outline">Actualizado {relativeTimeEs(w.updatedAt)}</span>
                  <div className="flex gap-1">
                    <Link href={`/admin/workspaces/${w.id}/edit`}>
                      <button
                        type="button"
                        className="h-7 w-7 inline-flex items-center justify-center rounded text-outline hover:bg-surface-container-low hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined !text-[14px]">edit</span>
                      </button>
                    </Link>
                    <button
                      type="button"
                      className="h-7 w-7 inline-flex items-center justify-center rounded text-outline hover:bg-surface-container-low hover:text-on-surface transition-colors"
                      onClick={() => void downloadJson(w.id)}
                    >
                      <span className="material-symbols-outlined !text-[14px]">download</span>
                    </button>
                    <button
                      type="button"
                      className="h-7 w-7 inline-flex items-center justify-center rounded text-outline hover:bg-error-container/20 hover:text-error-container transition-colors"
                      onClick={() => setDeleteTarget(w)}
                    >
                      <span className="material-symbols-outlined !text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar workspace"
        description={`¿Seguro que querés eliminar "${deleteTarget?.name}" (${deleteTarget?.slug})? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        tone="danger"
        pending={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
