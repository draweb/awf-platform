"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileTreeItem } from "./file-tree-item";

export type ArtifactListRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  versions: { version: string }[];
};

export type TarballFileInfo = { path: string; size: number };

/** A partir de esta cantidad de paquetes raíz se virtualiza el listado (rendimiento). */
export const ARTIFACT_TREE_VIRTUALIZE_THRESHOLD = 60;

function fileIcon(path: string): "description" | "code" | "article" | "data_object" | "terminal" | "css" {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "md" || ext === "mdx" || ext === "mdc") return "article";
  if (["ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs", "py"].includes(ext)) return "code";
  if (["json", "jsonc", "yaml", "yml", "toml", "xml"].includes(ext)) return "data_object";
  if (ext === "sh" || ext === "bash" || ext === "zsh" || ext === "ps1" || ext === "cmd") return "terminal";
  if (ext === "css" || ext === "scss") return "css";
  return "description";
}

export type ArtifactTreeFolderProps = {
  a: ArtifactListRow;
  expandedNames: Set<string>;
  loadingName: string | null;
  errorName: string | null;
  activeFileId: string | null;
  tarballFiles: Record<string, TarballFileInfo[]>;
  tarballFilesLoading: Set<string>;
  selectedVersionByArtifact: Record<string, string>;
  keyboardHighlightName: string | null;
  onToggleFolder: (name: string) => void;
  onOpenFile: (artifactName: string, virtualFile: "manifest" | "changelog" | "meta" | "tarball-file", tarballPath?: string) => void;
  onRetry?: (name: string) => void;
};

export function ArtifactTreeFolder({
  a,
  expandedNames,
  loadingName,
  errorName,
  activeFileId,
  tarballFiles,
  tarballFilesLoading,
  selectedVersionByArtifact,
  keyboardHighlightName,
  onToggleFolder,
  onOpenFile,
  onRetry,
}: ArtifactTreeFolderProps) {
  const expanded = expandedNames.has(a.name);
  const deprecated = a.status === "deprecated";
  const baseId = (vf: "manifest" | "changelog" | "meta") => `${encodeURIComponent(a.name)}::${vf}`;
  const tarballId = (p: string) => `${encodeURIComponent(a.name)}::file::${p}`;
  const ver = selectedVersionByArtifact[a.name];
  const cacheKey = ver ? `${a.name}@${ver}` : null;
  const files = cacheKey ? tarballFiles[cacheKey] ?? [] : [];
  const filesLoading = cacheKey ? tarballFilesLoading.has(cacheKey) : false;

  return (
    <div>
      <FileTreeItem
        depth={0}
        icon="folder"
        label={a.name}
        expanded={expanded}
        expandable
        deprecated={deprecated}
        keyboardFocused={keyboardHighlightName === a.name}
        onToggle={() => onToggleFolder(a.name)}
      />
      {expanded && (
        <div className="transition-opacity duration-150">
          {loadingName === a.name ? (
            <p className="pl-10 py-1 text-[11px] text-outline">Cargando…</p>
          ) : errorName === a.name ? (
            <div className="flex flex-col gap-1 pl-8 py-1">
              <p className="text-[11px] text-error">Error al cargar</p>
              {onRetry ? (
                <button type="button" className="w-fit text-[11px] text-primary underline" onClick={() => onRetry(a.name)}>
                  Reintentar
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {files.length > 0 && (
                <>
                  {files.map((f) => (
                    <FileTreeItem
                      key={f.path}
                      depth={1}
                      icon={fileIcon(f.path)}
                      label={f.path}
                      active={activeFileId === tarballId(f.path)}
                      onClick={() => onOpenFile(a.name, "tarball-file", f.path)}
                    />
                  ))}
                  <div className="pl-10 py-0.5">
                    <div className="border-t border-border/50" />
                  </div>
                </>
              )}
              {filesLoading && <p className="pl-10 py-1 text-[11px] text-outline">Cargando archivos…</p>}

              <FileTreeItem
                depth={1}
                icon="description"
                label="manifest.json"
                active={activeFileId === baseId("manifest")}
                onClick={() => onOpenFile(a.name, "manifest")}
              />
              <FileTreeItem
                depth={1}
                icon="description"
                label="changelog.md"
                active={activeFileId === baseId("changelog")}
                onClick={() => onOpenFile(a.name, "changelog")}
              />
              <FileTreeItem
                depth={1}
                icon="description"
                label="meta.yaml"
                active={activeFileId === baseId("meta")}
                onClick={() => onOpenFile(a.name, "meta")}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

type FileTreeProps = {
  artifacts: ArtifactListRow[];
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
  /** Resaltado por teclado en el nombre del paquete raíz. */
  keyboardHighlightName?: string | null;
  /** Virtualizar raíz si hay muchos paquetes (default true). */
  enableVirtualization?: boolean;
  /** Contenido al final del área scroll (p. ej. sentinel “cargar más”). */
  listFooter?: ReactNode;
};

function VirtualizedArtifactFileTree({
  artifacts,
  expandedNames,
  loadingName,
  errorName,
  activeFileId,
  tarballFiles,
  tarballFilesLoading,
  selectedVersionByArtifact,
  keyboardHighlightName,
  onToggleFolder,
  onOpenFile,
  onRetry,
  listFooter,
}: FileTreeProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: artifacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
    measureElement: (el) => (el as HTMLElement).getBoundingClientRect().height,
  });

  return (
    <div ref={parentRef} className="explorer-scrollbar min-h-0 flex-1 overflow-y-auto py-2">
      {artifacts.length === 0 ? (
        <p className="px-3 text-xs text-outline">No hay artefactos. Publicá uno con el CLI.</p>
      ) : (
        <>
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const a = artifacts[vi.index];
              if (!a) return null;
              return (
                <div
                  key={a.id}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  className="left-0 top-0 w-full"
                  style={{
                    position: "absolute",
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  <ArtifactTreeFolder
                    a={a}
                    expandedNames={expandedNames}
                    loadingName={loadingName}
                    errorName={errorName}
                    activeFileId={activeFileId}
                    tarballFiles={tarballFiles}
                    tarballFilesLoading={tarballFilesLoading}
                    selectedVersionByArtifact={selectedVersionByArtifact}
                    keyboardHighlightName={keyboardHighlightName ?? null}
                    onToggleFolder={onToggleFolder}
                    onOpenFile={onOpenFile}
                    onRetry={onRetry}
                  />
                </div>
              );
            })}
          </div>
          {listFooter}
        </>
      )}
    </div>
  );
}

export function FileTree({
  artifacts,
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
  keyboardHighlightName = null,
  enableVirtualization = true,
  listFooter,
}: FileTreeProps) {
  const folderProps = {
    expandedNames,
    loadingName,
    errorName,
    activeFileId,
    tarballFiles,
    tarballFilesLoading,
    selectedVersionByArtifact,
    keyboardHighlightName,
    onToggleFolder,
    onOpenFile,
    onRetry,
  };

  const useVirt = enableVirtualization && artifacts.length >= ARTIFACT_TREE_VIRTUALIZE_THRESHOLD;

  if (useVirt) {
    return (
      <VirtualizedArtifactFileTree
        artifacts={artifacts}
        listFooter={listFooter}
        {...folderProps}
      />
    );
  }

  return (
    <div className="explorer-scrollbar min-h-0 flex-1 overflow-y-auto py-2">
      {artifacts.length === 0 ? (
        <p className="px-3 text-xs text-outline">No hay artefactos. Publicá uno con el CLI.</p>
      ) : (
        <>
          {artifacts.map((a) => (
            <ArtifactTreeFolder key={a.id} a={a} {...folderProps} />
          ))}
          {listFooter}
        </>
      )}
    </div>
  );
}

/** Sentinel para disparar carga de la siguiente página del catálogo. */
export function CatalogScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit && !loading) onLoadMore();
      },
      { root: el.parentElement, rootMargin: "80px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="flex justify-center py-2">
      {loading ? (
        <span className="text-[10px] text-outline">Cargando más…</span>
      ) : (
        <span className="text-[10px] text-outline">↓ más resultados</span>
      )}
    </div>
  );
}
