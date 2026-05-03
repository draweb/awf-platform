"use client";

import type { Constitution } from "@/lib/domain/workspace-constitution";
import { isWorkspaceLabelPlaceholder, resolveWorkspaceIdentityLabel } from "@/lib/domain/workspace-validate";
import { Badge } from "@/components/ui/badge";

type ArtifactAssoc = {
  artifactId: string;
  name: string;
  type: string;
  pinnedVersion: string | null;
};

type LinkedLibrary = {
  libraryId: string;
  name: string;
  slug: string;
  artifactCount: number;
};

type Props = {
  name: string;
  slug: string;
  semver: string;
  status: "draft" | "active" | "archived";
  stacks: string[];
  artifacts: ArtifactAssoc[];
  linkedLibraries?: LinkedLibrary[];
  constitution: Constitution;
  workspaceId?: string;
  onEditIdentity: () => void;
  onEditStack: () => void;
  onEditConstitution: () => void;
  onEditArtifacts: () => void;
  onEditLibraries?: () => void;
  onDownloadJson: () => void;
};

const statusVariant = (s: string) => (s === "active" ? "info" : s === "archived" ? "danger" : "neutral");

export function CompositionAside({
  name,
  slug,
  semver,
  status,
  stacks,
  artifacts,
  linkedLibraries,
  onEditIdentity,
  onEditStack,
  onEditConstitution,
  onEditArtifacts,
  onEditLibraries,
  onDownloadJson,
  workspaceId,
}: Props) {
  const nameTrim = name.trim();
  const displayTitle = resolveWorkspaceIdentityLabel(name, slug) || "—";
  const showSlugRow = Boolean(
    slug.trim() && nameTrim && !isWorkspaceLabelPlaceholder(nameTrim) && nameTrim !== slug.trim(),
  );

  return (
    <aside className="w-72 border-l border-border bg-background flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="h-10 px-3 border-b border-border flex items-center justify-between shrink-0">
        <span className="label-xs-uppercase text-on-surface">Workspace Composition</span>
        <span className="material-symbols-outlined text-outline !text-[16px]">tune</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto ws-scrollbar p-3 flex flex-col gap-4">
        {/* Identity */}
        <section aria-label={`Identidad: ${resolveWorkspaceIdentityLabel(name, slug) || "workspace"} · ${slug || "sin slug"}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="label-xs-uppercase text-outline">Identidad</h4>
            <button type="button" className="text-[9px] text-primary hover:underline font-medium" onClick={onEditIdentity}>
              Editar
            </button>
          </div>
          <div className="space-y-2 rounded border border-border bg-footer p-2.5">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wide text-outline">Nombre</p>
              <p className="truncate text-[12px] font-medium text-on-surface" title={displayTitle}>
                {displayTitle}
              </p>
              {showSlugRow ? (
                <p className="mt-0.5 truncate font-mono text-[10px] text-outline" title={slug}>
                  {slug}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2">
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-on-surface">v{semver}</span>
              <Badge variant={statusVariant(status)} className="shrink-0">
                {status}
              </Badge>
            </div>
          </div>
        </section>

        {/* Stack */}
        <section aria-label="Stack">
          <div className="flex items-center justify-between mb-2">
            <h4 className="label-xs-uppercase text-outline">Stack técnico</h4>
            <button type="button" className="text-[9px] text-primary hover:underline font-medium" onClick={onEditStack}>
              + Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {stacks.length === 0 && <span className="text-[9px] text-outline italic">Sin stacks</span>}
            {stacks.map((s) => (
              <span key={s} className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low border border-border text-[10px] font-mono text-on-surface">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* Constitution shortcut */}
        <section aria-label="Constitución">
          <div className="flex items-center justify-between mb-2">
            <h4 className="label-xs-uppercase text-outline">Constitución</h4>
            <button type="button" className="text-[9px] text-primary hover:underline font-medium" onClick={onEditConstitution}>
              Editar secciones
            </button>
          </div>
          <p className="text-[9px] text-outline italic leading-relaxed">
            Editar las secciones constitucionales desde el drawer lateral.
          </p>
        </section>

        {/* Artifacts */}
        <section aria-label="Artefactos asociados">
          <div className="flex items-center justify-between mb-2">
            <h4 className="label-xs-uppercase text-outline">Artefactos ({artifacts.length})</h4>
            <button type="button" className="text-[9px] text-primary hover:underline font-medium" onClick={onEditArtifacts}>
              + Asociar
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {artifacts.length === 0 && <span className="text-[9px] text-outline italic">Sin artefactos asociados</span>}
            {artifacts.map((a) => (
              <div
                key={a.artifactId}
                className="p-2.5 bg-footer border border-border rounded flex flex-col gap-1 hover:border-border-strong transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-on-surface truncate max-w-[140px]">{a.name}</span>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0">
                    Linked
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-outline font-mono">
                  <span>{a.type}</span>
                  <span className="h-2.5 w-px bg-border" />
                  <span>{a.pinnedVersion?.trim() ? a.pinnedVersion : "latest"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Libraries */}
        <section aria-label="Bibliotecas enlazadas">
          <div className="flex items-center justify-between mb-2">
            <h4 className="label-xs-uppercase text-outline">Bibliotecas ({linkedLibraries?.length ?? 0})</h4>
            {onEditLibraries && (
              <button type="button" className="text-[9px] text-primary hover:underline font-medium" onClick={onEditLibraries}>
                + Enlazar
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {(!linkedLibraries || linkedLibraries.length === 0) && (
              <span className="text-[9px] text-outline italic">Sin bibliotecas enlazadas</span>
            )}
            {linkedLibraries?.map((l) => (
              <div
                key={l.libraryId}
                className="p-2.5 bg-footer border border-border rounded flex items-center gap-2 hover:border-border-strong transition-colors"
              >
                <span className="material-symbols-outlined text-[14px] text-outline">library_books</span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium text-on-surface truncate">{l.name}</span>
                  <span className="text-[9px] text-outline font-mono">{l.slug} · {l.artifactCount} art.</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Snapshot JSON */}
        {workspaceId && (
          <section aria-label="Snapshot JSON">
            <div className="flex items-center justify-between mb-2">
              <h4 className="label-xs-uppercase text-outline">Snapshot JSON</h4>
            </div>
            <button
              type="button"
              className="w-full p-2.5 bg-footer border border-border rounded text-[10px] font-mono text-on-surface flex items-center gap-2 hover:border-border-strong transition-colors"
              onClick={onDownloadJson}
            >
              <span className="material-symbols-outlined !text-[14px] text-outline">download</span>
              awf.workspace.json
            </button>
          </section>
        )}
      </div>
    </aside>
  );
}
