"use client";

import { useCallback, useState, type ReactNode } from "react";
import { StatusBadge } from "./status-badge";

export type ArtifactDetailForPanel = {
  name: string;
  type: string;
  description: string;
  status: "active" | "deprecated" | "archived";
  visibility: "private" | "internal" | "public";
  owner: string;
  versions: {
    id: string;
    version: string;
    status: "draft" | "review" | "published" | "deprecated" | "yanked";
    checksumSha256: string;
    sizeBytes: number;
  }[];
  distTags: { tag: string; version: string }[];
};

type MetadataPanelProps = {
  detail: ArtifactDetailForPanel | null;
  selectedVersion: string | null;
  onVersionChange: (version: string) => void;
  onYankSelectedVersion: () => Promise<void>;
  onDeprecateSelectedVersion: () => Promise<void>;
  onArchiveArtifact: () => Promise<void>;
  onReactivateArtifact: () => Promise<void>;
  onDeleteArtifact: () => Promise<void>;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const fieldBoxClass =
  "w-full rounded-xs border border-border bg-input px-3 py-1.5 font-mono text-xs text-on-surface-variant";

function PanelSection({ title, titleId, children }: { title: string; titleId: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-5 first:border-t-0 first:pt-0" aria-labelledby={titleId}>
      <h2 id={titleId} className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MetadataPanel({
  detail,
  selectedVersion,
  onVersionChange,
  onYankSelectedVersion,
  onDeprecateSelectedVersion,
  onArchiveArtifact,
  onReactivateArtifact,
  onDeleteArtifact,
}: MetadataPanelProps) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const runMutation = useCallback(async (fn: () => Promise<void>) => {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
      setDeleteConfirmText("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!detail) {
    return (
      <div className="p-4 text-xs text-outline">
        Seleccioná un artefacto y abrí un archivo en el árbol para ver metadata.
      </div>
    );
  }

  const ver = detail.versions.find((v) => v.version === selectedVersion) ?? detail.versions[0];
  const artifactStatus = detail.status;
  const versionStatus = ver?.status ?? "draft";
  const canYankOrDeprecateVersion = versionStatus === "published";
  const canArchivePackage = artifactStatus === "active";
  const canReactivatePackage = artifactStatus === "archived" || artifactStatus === "deprecated";
  const deleteNameMatches = deleteConfirmText.trim() === detail.name;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-busy={busy ? "true" : undefined}>
      <div className="explorer-scrollbar min-h-0 flex-1 space-y-0 overflow-y-auto p-4">
        <PanelSection title="Paquete" titleId="metadata-panel-paquete">
          <p className="truncate text-sm font-medium text-on-surface" title={detail.name}>
            {detail.name}
          </p>
          <p className="text-[11px] leading-snug text-outline">{detail.description}</p>
        </PanelSection>

        <PanelSection title="Estado" titleId="metadata-panel-estado">
          <div className="space-y-2 rounded-xs border border-border bg-footer p-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusBadge kind="artifact" status={artifactStatus} />
              {ver ? (
                <>
                  <span className="text-[10px] text-outline" aria-hidden>
                    ·
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-outline">Versión</span>
                  <StatusBadge kind="version" status={versionStatus} />
                </>
              ) : null}
            </div>
            <p className="text-[10px] leading-tight text-outline">
              Instancia de registry AWF. Los cambios de publicación se reflejan tras el próximo fetch.
            </p>
          </div>
        </PanelSection>

        <PanelSection title="Versión seleccionada" titleId="metadata-panel-version">
          <div className="relative">
            <label htmlFor="metadata-version-select" className="sr-only">
              Versión del artefacto
            </label>
            <select
              id="metadata-version-select"
              className="w-full appearance-none rounded-xs border border-border bg-input px-3 py-1.5 font-mono text-xs text-on-surface-variant outline-none focus:border-primary-container"
              value={selectedVersion ?? ver?.version ?? ""}
              disabled={busy}
              onChange={(e) => onVersionChange(e.target.value)}
            >
              {detail.versions.length === 0 ? (
                <option value="">Sin versiones</option>
              ) : (
                detail.versions.map((v) => (
                  <option key={v.id} value={v.version}>
                    {v.version} ({v.status})
                  </option>
                ))
              )}
            </select>
            <span className="pointer-events-none absolute right-2 top-1.5 text-sm text-outline material-symbols-outlined">
              expand_more
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <p className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider">Dist-tags</p>
            {detail.distTags.length === 0 ? (
              <p className="text-xs text-outline">—</p>
            ) : (
              <ul className="space-y-1 font-mono text-[11px]">
                {detail.distTags.map((t) => (
                  <li key={t.tag} className="text-on-surface-variant">
                    <span className="text-primary">{t.tag}</span> → {t.version}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {ver ? (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider">Integridad</p>
              <div>
                <p className="mb-0.5 text-[10px] uppercase tracking-wide text-outline">SHA-256</p>
                <p
                  className="truncate font-mono text-[10px] leading-tight text-on-surface-variant"
                  title={ver.checksumSha256}
                >
                  {ver.checksumSha256}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] uppercase tracking-wide text-outline">Tamaño</p>
                <p className="font-mono text-xs text-on-surface-variant">{formatBytes(ver.sizeBytes)}</p>
              </div>
            </div>
          ) : null}
        </PanelSection>

        <PanelSection title="Catálogo" titleId="metadata-panel-catalogo">
          <div className="space-y-2">
            <div>
              <p className="mb-0.5 font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider">Tipo</p>
              <div className={fieldBoxClass}>{detail.type}</div>
            </div>
            <div>
              <p className="mb-0.5 font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider">
                Visibilidad
              </p>
              <div className={`${fieldBoxClass} uppercase tracking-wide`}>{detail.visibility}</div>
            </div>
          </div>
        </PanelSection>

        <PanelSection title="Propiedad" titleId="metadata-panel-propiedad">
          <p className="mb-0.5 text-[10px] uppercase tracking-wide text-outline">ID de propietario</p>
          <p className="truncate font-mono text-xs text-on-surface-variant" title={detail.owner}>
            {detail.owner}
          </p>
        </PanelSection>

        <PanelSection title="Acciones" titleId="metadata-panel-acciones">
          <div className="space-y-3">
          {actionError ? (
            <p className="rounded-xs border border-error/40 bg-error/10 px-2 py-1.5 text-[11px] text-error" role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {canYankOrDeprecateVersion ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-xs border border-border bg-background px-2 py-1.5 text-left text-[11px] font-medium text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
                  onClick={() => {
                    if (
                      !confirm(
                        "¿Despublicar esta versión (yank)? Dejará de resolverse como latest y no se recomienda instalarla.",
                      )
                    )
                      return;
                    void runMutation(onYankSelectedVersion);
                  }}
                >
                  Despublicar versión (yank)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-xs border border-border bg-background px-2 py-1.5 text-left text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
                  onClick={() => {
                    if (!confirm("¿Deprecar esta versión? Seguirá existiendo pero marcada como deprecated.")) return;
                    void runMutation(onDeprecateSelectedVersion);
                  }}
                >
                  Deprecar versión
                </button>
              </>
            ) : null}
            {canArchivePackage ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-xs border border-border bg-background px-2 py-1.5 text-left text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
                onClick={() => {
                  if (!confirm("¿Archivar el paquete? Quedará inactivo en el catálogo (estado archived).")) return;
                  void runMutation(onArchiveArtifact);
                }}
              >
                Archivar paquete (inactivo)
              </button>
            ) : null}
            {canReactivatePackage ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-xs border border-border bg-background px-2 py-1.5 text-left text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
                onClick={() => {
                  if (!confirm("¿Volver a activar el paquete (estado active)?")) return;
                  void runMutation(onReactivateArtifact);
                }}
              >
                Reactivar paquete
              </button>
            ) : null}
          </div>
          </div>
        </PanelSection>

        <div className="border-t border-border pt-5">
          <div className="space-y-2 rounded-xs border border-error/35 bg-error/5 p-3">
            <h2 className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-error">Zona de riesgo</h2>
            <p className="text-[10px] leading-snug text-outline">
              El borrado es permanente (versiones, tags y blobs asociados según política del servidor). Escribí el nombre exacto del
              paquete para habilitar el botón.
            </p>
            <input
              type="text"
              disabled={busy}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={detail.name}
              className="w-full rounded-xs border border-border bg-input px-2 py-1.5 font-mono text-[11px] text-on-surface outline-none focus:border-error/60"
              autoComplete="off"
              aria-label="Confirmar nombre del paquete a eliminar"
            />
            <button
              type="button"
              disabled={busy || !deleteNameMatches}
              className="w-full rounded-xs border border-error/50 bg-error/15 px-2 py-1.5 text-[11px] font-semibold text-error transition-colors hover:bg-error/25 disabled:opacity-40"
              onClick={() => {
                if (!deleteNameMatches) return;
                if (
                  !confirm(
                    `¿Eliminar definitivamente el paquete "${detail.name}"? Esta acción no se puede deshacer desde el panel.`,
                  )
                )
                  return;
                void runMutation(onDeleteArtifact);
              }}
            >
              Eliminar paquete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
