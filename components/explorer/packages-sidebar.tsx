"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ARTIFACT_TYPES_API } from "@/lib/domain/artifact-types";
import { CatalogScrollSentinel, FileTree, type ArtifactListRow } from "./file-tree";
import type { TarballFileInfo } from "./file-tree";

type PackagesSidebarProps = {
  artifacts: ArtifactListRow[];
  searchText: string;
  onSearchTextChange: (v: string) => void;
  filterType: string;
  onFilterTypeChange: (v: string) => void;
  filterStatus: string;
  onFilterStatusChange: (v: string) => void;
  filterVisibility: string;
  onFilterVisibilityChange: (v: string) => void;
  catalogLoading: boolean;
  catalogError: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRefreshCatalog: () => void;
  onClearFilters: () => void;
  expandedNames: Set<string>;
  loadingName: string | null;
  errorName: string | null;
  activeFileId: string | null;
  tarballFiles: Record<string, TarballFileInfo[]>;
  tarballFilesLoading: Set<string>;
  selectedVersionByArtifact: Record<string, string>;
  onToggleFolder: (name: string) => void;
  onOpenFile: (artifactName: string, virtualFile: "manifest" | "changelog" | "meta" | "tarball-file", tarballPath?: string) => void;
  onRetry?: (name: string) => void;
};

export function PackagesSidebar({
  artifacts,
  searchText,
  onSearchTextChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  filterVisibility,
  onFilterVisibilityChange,
  catalogLoading,
  catalogError,
  hasMore,
  loadingMore,
  onLoadMore,
  onRefreshCatalog,
  onClearFilters,
  expandedNames,
  loadingName,
  errorName,
  activeFileId,
  tarballFiles,
  tarballFilesLoading,
  selectedVersionByArtifact,
  onToggleFolder,
  onOpenFile,
  onRetry,
}: PackagesSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const [kbdHighlightName, setKbdHighlightName] = useState<string | null>(null);
  const kbdHighlightRef = useRef<string | null>(null);
  kbdHighlightRef.current = kbdHighlightName;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const names = artifacts.map((a) => a.name);

  useEffect(() => {
    setKbdHighlightName((cur) => {
      if (!cur) return null;
      return names.includes(cur) ? cur : null;
    });
  }, [names]);

  const onSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setKbdHighlightName((cur) => {
          if (names.length === 0) return null;
          if (!cur) return names[0] ?? null;
          const i = names.indexOf(cur);
          if (i < 0) return names[0] ?? null;
          return names[Math.min(i + 1, names.length - 1)] ?? null;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setKbdHighlightName((cur) => {
          if (!cur || names.length === 0) return null;
          const i = names.indexOf(cur);
          if (i <= 0) return names[0] ?? null;
          return names[i - 1] ?? null;
        });
      } else if (e.key === "Enter") {
        const target = kbdHighlightRef.current;
        if (target && !expandedNames.has(target)) {
          e.preventDefault();
          onToggleFolder(target);
        }
      } else if (e.key === "Escape") {
        setKbdHighlightName(null);
      }
    },
    [names, expandedNames, onToggleFolder],
  );

  const filtersActive = Boolean(filterType || filterStatus || filterVisibility || searchText.trim().length >= 2);

  return (
    <div className="flex min-h-0 w-56 shrink-0 flex-col border-r border-border bg-background sm:w-64">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-border px-2">
        <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-on-surface-variant">
          Packages
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={`rounded-xs p-1 transition-colors ${
              filtersPanelOpen
                ? "bg-footer text-on-surface"
                : "text-outline hover:bg-footer hover:text-on-surface"
            }`}
            aria-expanded={filtersPanelOpen}
            aria-controls="packages-filters-panel"
            title="Mostrar u ocultar búsqueda y filtros"
            onClick={() => setFiltersPanelOpen((o) => !o)}
          >
            <span className="material-symbols-outlined scale-75" aria-hidden>
              search
            </span>
          </button>
          <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="rounded-xs p-1 text-outline hover:bg-footer hover:text-on-surface"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="material-symbols-outlined scale-75">more_horiz</span>
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-xs border border-border bg-background py-1 text-xs shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-1.5 text-left hover:bg-footer"
                onClick={() => {
                  setMenuOpen(false);
                  onRefreshCatalog();
                }}
              >
                Refrescar catálogo
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-1.5 text-left hover:bg-footer"
                onClick={() => {
                  setMenuOpen(false);
                  onClearFilters();
                  setKbdHighlightName(null);
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : null}
          </div>
        </div>
      </div>

      {filtersPanelOpen ? (
      <div id="packages-filters-panel" className="shrink-0 space-y-2 border-b border-border px-2 py-2">
        <input
          type="search"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Buscar (min. 2 caracteres)…"
          autoComplete="off"
          aria-busy={catalogLoading}
          className="w-full rounded-xs border border-border bg-input px-2 py-1.5 font-mono text-[11px] text-on-surface placeholder:text-outline outline-none ring-primary-container/30 focus:ring-2"
        />
        <div className="grid grid-cols-1 gap-1.5">
          <label className="flex flex-col gap-0.5">
            <span className="font-[family-name:var(--font-label)] text-[9px] uppercase tracking-wider text-outline">Tipo</span>
            <select
              value={filterType}
              onChange={(e) => onFilterTypeChange(e.target.value)}
              className="rounded-xs border border-border bg-input px-1.5 py-1 font-mono text-[10px] text-on-surface"
            >
              <option value="">Todos</option>
              {ARTIFACT_TYPES_API.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="font-[family-name:var(--font-label)] text-[9px] uppercase tracking-wider text-outline">Estado</span>
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="rounded-xs border border-border bg-input px-1.5 py-1 font-mono text-[10px] text-on-surface"
            >
              <option value="">Todos</option>
              <option value="active">active</option>
              <option value="deprecated">deprecated</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="font-[family-name:var(--font-label)] text-[9px] uppercase tracking-wider text-outline">Visibilidad</span>
            <select
              value={filterVisibility}
              onChange={(e) => onFilterVisibilityChange(e.target.value)}
              className="rounded-xs border border-border bg-input px-1.5 py-1 font-mono text-[10px] text-on-surface"
            >
              <option value="">Todas</option>
              <option value="private">private</option>
              <option value="internal">internal</option>
              <option value="public">public</option>
            </select>
          </label>
        </div>
      </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {catalogError ? <p className="shrink-0 px-2 py-1 text-[11px] text-error">{catalogError}</p> : null}
        {catalogLoading && artifacts.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-outline">Cargando catálogo…</p>
        ) : !catalogLoading && artifacts.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-outline">
            {filtersActive ? "Sin resultados con estos filtros." : "No hay artefactos."}
          </p>
        ) : (
          <FileTree
            artifacts={artifacts}
            expandedNames={expandedNames}
            loadingName={loadingName}
            errorName={errorName}
            activeFileId={activeFileId}
            tarballFiles={tarballFiles}
            tarballFilesLoading={tarballFilesLoading}
            selectedVersionByArtifact={selectedVersionByArtifact}
            onToggleFolder={onToggleFolder}
            onOpenFile={onOpenFile}
            onRetry={onRetry}
            keyboardHighlightName={kbdHighlightName}
            listFooter={<CatalogScrollSentinel hasMore={hasMore} loading={loadingMore} onLoadMore={onLoadMore} />}
          />
        )}
      </div>
    </div>
  );
}
