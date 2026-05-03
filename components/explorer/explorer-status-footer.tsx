"use client";

export type ExplorerStatusFooterProps = {
  catalogLoading: boolean;
  catalogError: string | null;
  artifactCount: number;
  hasMore: boolean;
  focusedPackageName: string | null;
  selectedVersion: string | null;
  activeFileTitle: string | null;
};

function catalogLabel(loading: boolean, count: number, more: boolean): string {
  if (loading && count === 0) return "Cargando catálogo…";
  const suffix = count === 1 ? "artefacto" : "artefactos";
  const n = more && count > 0 ? `${count}+` : String(count);
  return `Catálogo: ${n} ${suffix}`;
}

export function ExplorerStatusFooter({
  catalogLoading,
  catalogError,
  artifactCount,
  hasMore,
  focusedPackageName,
  selectedVersion,
  activeFileTitle,
}: ExplorerStatusFooterProps) {
  const left = catalogLabel(catalogLoading, artifactCount, hasMore);

  const focus =
    focusedPackageName && selectedVersion
      ? `${focusedPackageName} @ ${selectedVersion}`
      : focusedPackageName
        ? focusedPackageName
        : "Sin paquete en foco";

  const view = activeFileTitle?.trim() ? activeFileTitle : "Sin archivo abierto";

  return (
    <footer
      role="status"
      aria-live="polite"
      className="flex h-6 shrink-0 items-center gap-2 overflow-hidden border-t border-border bg-background px-3 font-mono text-[9px] text-on-surface-variant"
    >
      <span
        className={`min-w-0 max-w-[30%] shrink truncate ${catalogError ? "text-error" : "text-outline"}`}
        title={catalogError ?? left}
      >
        {catalogError ?? left}
      </span>
      <span className="shrink-0 text-outline/50" aria-hidden>
        ·
      </span>
      <span className="min-w-0 flex-1 truncate" title={focus}>
        {focus}
      </span>
      <span className="shrink-0 text-outline/50" aria-hidden>
        ·
      </span>
      <span className="max-w-[40%] shrink-0 truncate text-outline" title={view}>
        {view}
      </span>
    </footer>
  );
}
