"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExplorerStatusFooter } from "@/components/explorer/explorer-status-footer";
import { CodeViewer } from "@/components/explorer/code-viewer";
import { EditorTabs, type EditorTab } from "@/components/explorer/editor-tabs";
import { PackagesSidebar } from "@/components/explorer/packages-sidebar";
import { MetadataPanel, type ArtifactDetailForPanel } from "@/components/explorer/metadata-panel";
import { artifactListRowFromArtifactDetailJson } from "@/lib/explorer/artifact-list-map";
import { useArtifactCatalogQuery } from "@/lib/explorer/use-artifact-catalog-query";
import {
  pickVersionAfterRefetch,
  readApiErrorMessage,
  stripTarballCacheKeysForArtifact,
} from "@/lib/explorer/artifact-explorer-mutation-helpers";
import { langFromPath } from "@/lib/explorer/lang-from-path";
import { buildMetaYaml, stringifyManifest } from "@/lib/explorer/virtual-files";

type VersionDetail = {
  id: string;
  version: string;
  status: "draft" | "review" | "published" | "deprecated" | "yanked";
  checksumSha256: string;
  sizeBytes: number;
  manifest: unknown;
  changelog: string;
  createdAt: string;
  publishedAt: string | null;
};

type ArtifactDetail = {
  id: string;
  name: string;
  type: string;
  description: string;
  status: "active" | "deprecated" | "archived";
  visibility: "private" | "internal" | "public";
  owner: string;
  versions: VersionDetail[];
  distTags: { tag: string; version: string }[];
};

type FileKind = "manifest" | "changelog" | "meta" | "tarball-file";

type OpenTab = {
  id: string;
  title: string;
  artifactName: string;
  fileKind: FileKind;
  tarballPath?: string;
};

function tabId(name: string, kind: FileKind, tarballPath?: string): string {
  if (tarballPath) return `${encodeURIComponent(name)}::file::${tarballPath}`;
  return `${encodeURIComponent(name)}::${kind}`;
}

type TarballFileEntry = { path: string; content: string; size: number };

function asArtifactStatus(s: unknown): ArtifactDetail["status"] {
  return s === "deprecated" || s === "archived" || s === "active" ? s : "active";
}

function asVisibility(s: unknown): ArtifactDetail["visibility"] {
  return s === "private" || s === "public" || s === "internal" ? s : "internal";
}

function asVersionStatus(s: unknown): VersionDetail["status"] {
  const v = String(s ?? "draft");
  if (v === "draft" || v === "review" || v === "published" || v === "deprecated" || v === "yanked") return v;
  return "draft";
}

function normalizeDetail(raw: unknown): ArtifactDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const versionsRaw = Array.isArray(o.versions) ? o.versions : [];
  const versions: VersionDetail[] = versionsRaw.map((vr) => {
    const v = vr as Record<string, unknown>;
    return {
      id: String(v.id ?? ""),
      version: String(v.version ?? ""),
      status: asVersionStatus(v.status),
      checksumSha256: String(v.checksumSha256 ?? ""),
      sizeBytes: Number(v.sizeBytes ?? 0),
      manifest: v.manifest,
      changelog: String(v.changelog ?? ""),
      createdAt: String(v.createdAt ?? ""),
      publishedAt: v.publishedAt == null ? null : String(v.publishedAt),
    };
  });
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    type: String(o.type ?? ""),
    description: String(o.description ?? ""),
    status: asArtifactStatus(o.status),
    visibility: asVisibility(o.visibility),
    owner: String(o.owner ?? ""),
    versions,
    distTags: Array.isArray(o.distTags) ? (o.distTags as { tag: string; version: string }[]) : [],
  };
}

function ArtifactsExplorerBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageFromUrl = searchParams.get("package");
  const openedManifestFromUrl = useRef(false);

  const [filterQ, setFilterQ] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("");
  const {
    items: artifacts,
    loading: catalogLoading,
    error: catalogError,
    hasMore,
    fetchMore,
    mergeRowIfMissing,
    refresh: refreshCatalog,
    loadingMore: catalogLoadingMore,
  } = useArtifactCatalogQuery({
    q: filterQ,
    type: filterType,
    status: filterStatus,
    visibility: filterVisibility,
  });

  const [expandedNames, setExpandedNames] = useState<Set<string>>(() => new Set());
  const [detailCache, setDetailCache] = useState<Record<string, ArtifactDetail>>({});
  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [errorName, setErrorName] = useState<string | null>(null);
  const [versionByArtifact, setVersionByArtifact] = useState<Record<string, string>>({});
  const [focusedArtifact, setFocusedArtifact] = useState<string | null>(null);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tarballFilesCache, setTarballFilesCache] = useState<Record<string, TarballFileEntry[]>>({});
  const [tarballFilesLoading, setTarballFilesLoading] = useState<Set<string>>(() => new Set());

  const loadDetail = useCallback(async (name: string) => {
    setLoadingName(name);
    setErrorName(null);
    const pathSeg = encodeURIComponent(name);
    try {
      const res = await fetch(`/api/v1/artifacts/${pathSeg}`, { credentials: "include" });
      const j = await res.json();
      if (!res.ok) {
        setErrorName(name);
        setLoadingName(null);
        return;
      }
      const d = normalizeDetail(j);
      if (d) {
        setDetailCache((prev) => ({ ...prev, [name]: d }));
        const firstVer = d.versions[0]?.version;
        setVersionByArtifact((prev) => {
          if (prev[name]) return prev;
          return firstVer ? { ...prev, [name]: firstVer } : prev;
        });
        if (firstVer) {
          void loadTarballFiles(name, firstVer);
        }
      }
    } finally {
      setLoadingName(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadTarballFiles se define a continuación; deps vacías intencionales
  }, []);

  const loadTarballFiles = useCallback(async (artifactName: string, version: string) => {
    const cacheKey = `${artifactName}@${version}`;
    if (tarballFilesCache[cacheKey]) return;
    setTarballFilesLoading((prev) => new Set(prev).add(cacheKey));
    try {
      const pathSeg = encodeURIComponent(artifactName);
      const verSeg = encodeURIComponent(version);
      const res = await fetch(`/api/v1/artifacts/${pathSeg}/versions/${verSeg}/files`, { credentials: "include" });
      if (res.ok) {
        const j = (await res.json()) as { files: TarballFileEntry[] };
        setTarballFilesCache((prev) => ({ ...prev, [cacheKey]: j.files ?? [] }));
      }
    } finally {
      setTarballFilesLoading((prev) => {
        const next = new Set(prev);
        next.delete(cacheKey);
        return next;
      });
    }
  }, [tarballFilesCache]);

  const refreshDetailFromServer = useCallback(async (name: string, previousVersion: string | null) => {
    const pathSeg = encodeURIComponent(name);
    const res = await fetch(`/api/v1/artifacts/${pathSeg}`, { credentials: "include" });
    const j = await res.json();
    if (!res.ok) throw new Error(readApiErrorMessage(j));
    const d = normalizeDetail(j);
    if (!d) throw new Error("Respuesta inválida");
    setDetailCache((prev) => ({ ...prev, [name]: d }));
    const nextVer = pickVersionAfterRefetch(d.versions, previousVersion);
    setVersionByArtifact((prev) => (nextVer ? { ...prev, [name]: nextVer } : prev));
    if (nextVer) void loadTarballFiles(name, nextVer);
    return d;
  }, [loadTarballFiles]);

  const onToggleFolder = useCallback(
    (name: string) => {
      let expanding = false;
      setExpandedNames((prev) => {
        expanding = !prev.has(name);
        const next = new Set(prev);
        if (expanding) next.add(name);
        else next.delete(name);
        return next;
      });
      if (expanding) {
        setFocusedArtifact(name);
        if (!detailCache[name]) void loadDetail(name);
      }
    },
    [detailCache, loadDetail],
  );

  const onRetry = useCallback(
    (name: string) => {
      void loadDetail(name);
    },
    [loadDetail],
  );

  const focusedDetail = focusedArtifact ? detailCache[focusedArtifact] ?? null : null;
  const selectedVersion = focusedArtifact ? versionByArtifact[focusedArtifact] ?? focusedDetail?.versions[0]?.version ?? null : null;

  const tabContent = useMemo(() => {
    if (!activeTabId) return { content: "", language: "plain" as const };
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return { content: "", language: "plain" as const };
    const detail = detailCache[tab.artifactName];
    const verStr = versionByArtifact[tab.artifactName] ?? detail?.versions[0]?.version;
    const ver = detail?.versions.find((v) => v.version === verStr) ?? detail?.versions[0];
    if (!detail) return { content: "", language: "plain" as const };

    if (tab.fileKind === "tarball-file" && tab.tarballPath) {
      const cacheKey = `${tab.artifactName}@${verStr}`;
      const files = tarballFilesCache[cacheKey];
      if (!files) return { content: "Cargando archivo…", language: "plain" as const };
      const f = files.find((e) => e.path === tab.tarballPath);
      if (!f) return { content: `Archivo no encontrado: ${tab.tarballPath}`, language: "plain" as const };
      const lang = langFromPath(tab.tarballPath);
      return { content: f.content, language: lang };
    }

    if (tab.fileKind === "manifest") {
      if (!ver) return { content: "// Sin versiones con manifest", language: "plain" as const };
      return { content: stringifyManifest(ver.manifest), language: "json" as const };
    }
    if (tab.fileKind === "changelog") {
      if (!ver) return { content: "_No changelog (sin versiones)_", language: "markdown" as const };
      const c = ver.changelog?.trim();
      return { content: c || "_Sin changelog para esta versión._", language: "markdown" as const };
    }
    return {
      content: buildMetaYaml(
        {
          name: detail.name,
          type: detail.type,
          description: detail.description,
          status: detail.status,
          visibility: detail.visibility,
          owner: detail.owner,
          distTags: detail.distTags,
        },
        ver
          ? {
              version: ver.version,
              status: ver.status,
              checksumSha256: ver.checksumSha256,
              sizeBytes: ver.sizeBytes,
              manifest: ver.manifest,
              changelog: ver.changelog,
              createdAt: ver.createdAt,
              publishedAt: ver.publishedAt,
            }
          : null,
      ),
      language: "yaml" as const,
    };
  }, [activeTabId, tabs, detailCache, versionByArtifact, tarballFilesCache]);

  const onOpenFile = useCallback(
    (artifactName: string, virtualFile: "manifest" | "changelog" | "meta" | "tarball-file", tarballPath?: string) => {
      const id = tabId(artifactName, virtualFile, tarballPath);
      const titles: Record<string, string> = {
        manifest: "manifest.json",
        changelog: "changelog.md",
        meta: "meta.yaml",
      };
      const title = virtualFile === "tarball-file" && tarballPath ? tarballPath : titles[virtualFile] ?? virtualFile;
      setFocusedArtifact(artifactName);
      setTabs((prev) => {
        if (prev.some((t) => t.id === id)) return prev;
        return [...prev, { id, title, artifactName, fileKind: virtualFile, tarballPath }];
      });
      setActiveTabId(id);
    },
    [],
  );

  /** Al cambiar de pestaña (o al cerrar y quedar otra activa), Parameters usa el paquete del tab activo. */
  useEffect(() => {
    if (!activeTabId) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const name = tab.artifactName;
    setFocusedArtifact(name);
    if (!detailCache[name]) void loadDetail(name);
  }, [activeTabId, tabs, detailCache, loadDetail]);

  useEffect(() => {
    openedManifestFromUrl.current = false;
  }, [packageFromUrl]);

  useEffect(() => {
    if (!packageFromUrl) return;
    let name: string;
    try {
      name = decodeURIComponent(packageFromUrl);
    } catch {
      return;
    }
    if (artifacts.some((a) => a.name === name)) {
      setExpandedNames((prev) => new Set(prev).add(name));
      setFocusedArtifact(name);
      void loadDetail(name);
      return;
    }
    if (catalogLoading) return;
    let cancelled = false;
    void (async () => {
      const pathSeg = encodeURIComponent(name);
      const res = await fetch(`/api/v1/artifacts/${pathSeg}`, { credentials: "include" });
      const j = (await res.json()) as Record<string, unknown> & { error?: { message?: string } };
      if (cancelled || !res.ok || j.error) return;
      const row = artifactListRowFromArtifactDetailJson(j);
      if (row) mergeRowIfMissing(row);
      setExpandedNames((prev) => new Set(prev).add(name));
      setFocusedArtifact(name);
      void loadDetail(name);
    })();
    return () => {
      cancelled = true;
    };
  }, [packageFromUrl, artifacts, catalogLoading, loadDetail, mergeRowIfMissing]);

  useEffect(() => {
    if (!packageFromUrl || openedManifestFromUrl.current) return;
    let name: string;
    try {
      name = decodeURIComponent(packageFromUrl);
    } catch {
      return;
    }
    const d = detailCache[name];
    if (!d?.versions.length) return;
    const mid = tabId(name, "manifest");
    if (tabs.some((t) => t.id === mid)) {
      openedManifestFromUrl.current = true;
      return;
    }
    openedManifestFromUrl.current = true;
    onOpenFile(name, "manifest");
  }, [packageFromUrl, detailCache, tabs, onOpenFile]);

  const editorTabs: EditorTab[] = tabs.map((t) => ({ id: t.id, title: t.title }));

  const onCloseTab = useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      setActiveTabId((cur) => {
        if (cur !== id) return cur;
        if (next.length === 0) return null;
        const newIdx = Math.min(idx, next.length - 1);
        return next[newIdx]?.id ?? null;
      });
      return next;
    });
  }, []);

  const onVersionChange = useCallback((version: string) => {
    if (!focusedArtifact) return;
    setVersionByArtifact((prev) => ({ ...prev, [focusedArtifact]: version }));
    void loadTarballFiles(focusedArtifact, version);
  }, [focusedArtifact, loadTarballFiles]);

  const invalidateTarballCacheKey = useCallback((artifactName: string, version: string) => {
    const key = `${artifactName}@${version}`;
    setTarballFilesCache((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleYankSelectedVersion = useCallback(async () => {
    if (!focusedArtifact || !selectedVersion) throw new Error("Sin versión seleccionada");
    const name = focusedArtifact;
    const ver = selectedVersion;
    const pathSeg = encodeURIComponent(name);
    const verSeg = encodeURIComponent(ver);
    const res = await fetch(`/api/v1/artifacts/${pathSeg}/versions/${verSeg}/yank`, {
      method: "POST",
      credentials: "include",
    });
    const j = await res.json();
    if (!res.ok) throw new Error(readApiErrorMessage(j));
    invalidateTarballCacheKey(name, ver);
    await refreshDetailFromServer(name, ver);
    refreshCatalog();
  }, [
    focusedArtifact,
    selectedVersion,
    invalidateTarballCacheKey,
    refreshDetailFromServer,
    refreshCatalog,
  ]);

  const handleDeprecateSelectedVersion = useCallback(async () => {
    if (!focusedArtifact || !selectedVersion) throw new Error("Sin versión seleccionada");
    const name = focusedArtifact;
    const ver = selectedVersion;
    const pathSeg = encodeURIComponent(name);
    const verSeg = encodeURIComponent(ver);
    const res = await fetch(`/api/v1/artifacts/${pathSeg}/versions/${verSeg}/deprecate`, {
      method: "POST",
      credentials: "include",
    });
    const j = await res.json();
    if (!res.ok) throw new Error(readApiErrorMessage(j));
    invalidateTarballCacheKey(name, ver);
    await refreshDetailFromServer(name, ver);
    refreshCatalog();
  }, [
    focusedArtifact,
    selectedVersion,
    invalidateTarballCacheKey,
    refreshDetailFromServer,
    refreshCatalog,
  ]);

  const handleArchiveArtifact = useCallback(async () => {
    if (!focusedArtifact) throw new Error("Sin paquete");
    const name = focusedArtifact;
    const pathSeg = encodeURIComponent(name);
    const prevVer = versionByArtifact[name] ?? null;
    const res = await fetch(`/api/v1/artifacts/${pathSeg}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(readApiErrorMessage(j));
    await refreshDetailFromServer(name, prevVer);
    refreshCatalog();
  }, [focusedArtifact, versionByArtifact, refreshDetailFromServer, refreshCatalog]);

  const handleReactivateArtifact = useCallback(async () => {
    if (!focusedArtifact) throw new Error("Sin paquete");
    const name = focusedArtifact;
    const pathSeg = encodeURIComponent(name);
    const prevVer = versionByArtifact[name] ?? null;
    const res = await fetch(`/api/v1/artifacts/${pathSeg}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(readApiErrorMessage(j));
    await refreshDetailFromServer(name, prevVer);
    refreshCatalog();
  }, [focusedArtifact, versionByArtifact, refreshDetailFromServer, refreshCatalog]);

  const handleDeleteArtifact = useCallback(async () => {
    if (!focusedArtifact) throw new Error("Sin paquete");
    const name = focusedArtifact;
    const pathSeg = encodeURIComponent(name);
    const res = await fetch(`/api/v1/artifacts/${pathSeg}`, { method: "DELETE", credentials: "include" });
    const j = await res.json();
    if (!res.ok) throw new Error(readApiErrorMessage(j));
    setDetailCache((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setTarballFilesCache((prev) => stripTarballCacheKeysForArtifact(name, prev));
    setTabs((prev) => {
      const next = prev.filter((t) => t.artifactName !== name);
      setActiveTabId((cur) => {
        if (cur && next.some((t) => t.id === cur)) return cur;
        return next[0]?.id ?? null;
      });
      return next;
    });
    setExpandedNames((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    setVersionByArtifact((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFocusedArtifact((fa) => (fa === name ? null : fa));
    refreshCatalog();
    let urlPackage: string | null = null;
    if (packageFromUrl) {
      try {
        urlPackage = decodeURIComponent(packageFromUrl);
      } catch {
        urlPackage = null;
      }
    }
    if (urlPackage === name) router.replace("/admin/artifacts");
  }, [focusedArtifact, refreshCatalog, router, packageFromUrl]);

  const panelDetail: ArtifactDetailForPanel | null = focusedDetail;
  const activeFileTitle = activeTabId ? (tabs.find((t) => t.id === activeTabId)?.title ?? null) : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-4.25rem)] max-h-[calc(100dvh-4.25rem)] -mx-4 -my-3 text-on-surface">
      <section className="flex flex-1 min-h-0 overflow-hidden flex-col border border-border rounded-xs bg-background">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <PackagesSidebar
            artifacts={artifacts}
            searchText={filterQ}
            onSearchTextChange={setFilterQ}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterVisibility={filterVisibility}
            onFilterVisibilityChange={setFilterVisibility}
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            hasMore={hasMore}
            loadingMore={catalogLoadingMore}
            onLoadMore={fetchMore}
            onRefreshCatalog={refreshCatalog}
            onClearFilters={() => {
              setFilterQ("");
              setFilterType("");
              setFilterStatus("");
              setFilterVisibility("");
            }}
            expandedNames={expandedNames}
            loadingName={loadingName}
            errorName={errorName}
            activeFileId={tabs.find((t) => t.id === activeTabId)?.id ?? null}
            tarballFiles={Object.fromEntries(
              Object.entries(tarballFilesCache).map(([k, files]) => [k, files.map((f) => ({ path: f.path, size: f.size }))]),
            )}
            tarballFilesLoading={tarballFilesLoading}
            selectedVersionByArtifact={versionByArtifact}
            onToggleFolder={onToggleFolder}
            onOpenFile={onOpenFile}
            onRetry={onRetry}
          />

          {/* Center: editor (mismo patrón de fondo que MarkdownCanvas del workspace) */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-input markdown-editor-bg">
            <EditorTabs
              tabs={editorTabs}
              activeId={activeTabId}
              onSelect={setActiveTabId}
              onClose={onCloseTab}
              tabPanelId="explorer-editor-panel"
            />
            <div
              id="explorer-editor-panel"
              role="tabpanel"
              aria-label="Contenido del archivo"
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              {activeTabId && tabs.length > 0 ? (
                <CodeViewer
                  key={activeTabId}
                  content={tabContent.content}
                  language={tabContent.language}
                  fileLabel={tabs.find((t) => t.id === activeTabId)?.title ?? null}
                  className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                />
              ) : (
                <div className="p-6 text-sm text-outline">Abrí un archivo desde el árbol (manifest, changelog o meta).</div>
              )}
            </div>
          </div>

          {/* Right: metadata */}
          <div className="w-72 bg-background border-l border-border flex-col shrink-0 min-h-0 hidden xl:flex">
            <div className="h-8 px-3 flex items-center justify-between border-b border-border shrink-0">
              <span className="font-[family-name:var(--font-label)] text-[10px] uppercase text-on-surface-variant tracking-wider">
                Parámetros
              </span>
              <span className="material-symbols-outlined text-outline scale-75">tune</span>
            </div>
            <MetadataPanel
              detail={panelDetail}
              selectedVersion={selectedVersion}
              onVersionChange={onVersionChange}
              onYankSelectedVersion={handleYankSelectedVersion}
              onDeprecateSelectedVersion={handleDeprecateSelectedVersion}
              onArchiveArtifact={handleArchiveArtifact}
              onReactivateArtifact={handleReactivateArtifact}
              onDeleteArtifact={handleDeleteArtifact}
            />
          </div>
        </div>

        <ExplorerStatusFooter
          catalogLoading={catalogLoading}
          catalogError={catalogError}
          artifactCount={artifacts.length}
          hasMore={hasMore}
          focusedPackageName={focusedDetail?.name ?? null}
          selectedVersion={selectedVersion}
          activeFileTitle={activeFileTitle}
        />
      </section>
    </div>
  );
}

export default function ArtifactsExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-border bg-footer px-4 py-12 text-center">
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-outline">Cargando explorador…</p>
        </div>
      }
    >
      <ArtifactsExplorerBody />
    </Suspense>
  );
}
