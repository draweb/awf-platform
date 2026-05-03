"use client";

import Link from "next/link";
import { resolveWorkspaceIdentityLabel } from "@/lib/domain/workspace-validate";

function relativeSeconds(iso: string | null): string {
  if (!iso) return "";
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return "ahora";
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.round(sec / 60);
  return `hace ${min}m`;
}

const PLACEHOLDER_NAME = "mi-workspace";

type Props = {
  name: string;
  slug: string;
  status: "draft" | "active" | "archived";
  lastSavedAt: string | null;
  /** Abre el flujo de edición de identidad (nombre / slug). */
  onEditIdentity?: () => void;
};

const statusColor: Record<string, string> = {
  draft: "bg-outline",
  active: "bg-emerald-500",
  archived: "bg-error-container",
};

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

export function WorkspaceBreadcrumb({ name, slug, status, lastSavedAt, onEditIdentity }: Props) {
  const resolved = resolveWorkspaceIdentityLabel(name, slug).trim();
  const displayName = resolved || PLACEHOLDER_NAME;
  const detailTitle = slug.trim() && slug.trim() !== displayName ? `Slug: ${slug.trim()}` : undefined;
  const hintTitle = [detailTitle, "Clic para editar nombre y slug"].filter(Boolean).join(" · ");

  const nameBlock = onEditIdentity ? (
    <button
      type="button"
      onClick={onEditIdentity}
      title={hintTitle}
      aria-label="Editar nombre y slug del workspace"
      className="group/name flex items-center gap-2 min-w-0 max-w-[min(100%,32rem)] rounded-md border border-dashed border-primary/35 bg-surface-container-low/60 px-2.5 py-1 text-left transition-[border-color,background-color,box-shadow] hover:border-primary/55 hover:bg-footer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-input"
    >
      <span className="truncate text-sm font-mono font-medium text-primary leading-snug">{displayName}</span>
      <span
        className="material-symbols-outlined shrink-0 text-primary/70 transition-colors group-hover/name:text-primary !text-[17px]"
        aria-hidden
      >
        edit_square
      </span>
    </button>
  ) : (
    <span
      className="text-sm font-mono font-medium text-primary truncate max-w-[min(100%,32rem)] outline-none leading-snug"
      title={detailTitle ?? displayName}
    >
      {displayName}
    </span>
  );

  return (
    <div className="min-h-10 h-10 border-b border-border flex items-center justify-between gap-3 px-4 bg-input">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          href="/admin/workspaces"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-outline transition-colors hover:border-border hover:bg-footer hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-input"
          aria-label="Volver a la lista de workspaces"
          title="Volver a workspaces"
        >
          <span className="material-symbols-outlined !text-[20px]" aria-hidden>
            arrow_back
          </span>
        </Link>
        {nameBlock}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`dot-status ${statusColor[status]} ${status === "active" ? "animate-pulse" : ""}`} />
          <span className="label-xs-uppercase text-outline">{statusLabel[status]}</span>
        </div>
        {lastSavedAt && (
          <>
            <div className="h-3 w-px bg-border" />
            <span className="text-[10px] font-mono text-outline">Guardado {relativeSeconds(lastSavedAt)}</span>
          </>
        )}
      </div>
    </div>
  );
}
