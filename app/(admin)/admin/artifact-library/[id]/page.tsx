"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAlert } from "@/components/ui/alert-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ArtifactRow = {
  artifactId: string;
  name: string;
  type: string;
  /** Descripción del artefacto en el registry (puede ser vacía). */
  description?: string;
  pinnedVersion: string | null;
  order: number;
};

type LibraryDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  artifacts: ArtifactRow[];
};

type CatalogArtifact = { id: string; name: string; type: string; description?: string };

function arraysEqual(a: ArtifactRow[], b: ArtifactRow[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.artifactId === b[i]?.artifactId && item.pinnedVersion === b[i]?.pinnedVersion);
}

function typeLabel(t: string): string {
  const s = (t || "").trim();
  return s.length > 0 ? s : "sin tipo";
}

function ArtifactDescriptionBlurb({ text }: { text: string | undefined | null }) {
  const t = (text ?? "").trim();
  if (!t) return null;
  return (
    <p className="mt-1 text-[11px] leading-snug text-outline/90 line-clamp-2">{t}</p>
  );
}

export default function LibraryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useAlert();

  const openedPickerFromQuery = useRef(false);

  const [lib, setLib] = useState<LibraryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogArtifact[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  /** "all" o el valor exacto de `artifact.type` */
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const savedSnapshot = useRef<ArtifactRow[]>([]);

  useEffect(() => {
    openedPickerFromQuery.current = false;
  }, [params.id]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/libraries/${params.id}`, { credentials: "include" });
    const j = await res.json();
    if (!res.ok) {
      showError(j.error?.message ?? "No se pudo cargar");
      return;
    }
    setLib(j.library);
    savedSnapshot.current = j.library.artifacts;
  }, [params.id, showError]);

  useEffect(() => {
    let c = false;
    setLoading(true);
    Promise.all([
      load(),
      fetch("/api/v1/artifacts?limit=100", { credentials: "include" })
        .then((r) => r.json())
        .then((j: { items?: CatalogArtifact[] }) => setCatalog(j.items ?? [])),
    ]).finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [load]);

  /** Tras crear una biblioteca nueva: enfocar búsqueda (query `?pick=1`). */
  useEffect(() => {
    if (openedPickerFromQuery.current) return;
    if (searchParams.get("pick") !== "1") return;
    openedPickerFromQuery.current = true;
    router.replace(`/admin/artifact-library/${params.id}`, { scroll: false });
    requestAnimationFrame(() => {
      document.getElementById("library-catalog-search")?.focus();
    });
  }, [searchParams, params.id, router]);

  const memberIds = new Set(lib?.artifacts.map((a) => a.artifactId) ?? []);
  const isDirty = lib ? !arraysEqual(lib.artifacts, savedSnapshot.current) : false;

  const catalogTypes = useMemo(() => {
    const s = new Set<string>();
    for (const c of catalog) {
      s.add(typeLabel(c.type));
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [catalog]);

  const available = useMemo(() => {
    const ids = new Set(lib?.artifacts.map((a) => a.artifactId) ?? []);
    return catalog.filter((c) => !ids.has(c.id));
  }, [catalog, lib?.artifacts]);

  const filteredAvailable = useMemo(() => {
    let list = available;
    if (typeFilter !== "all") {
      list = list.filter((a) => typeLabel(a.type) === typeFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        if (a.name.toLowerCase().includes(q)) return true;
        const d = (a.description ?? "").toLowerCase();
        return d.includes(q);
      });
    }
    return list;
  }, [available, typeFilter, searchQuery]);

  const addArtifact = (art: CatalogArtifact) => {
    if (!lib || memberIds.has(art.id)) return;
    setLib({
      ...lib,
      artifacts: [
        ...lib.artifacts,
        {
          artifactId: art.id,
          name: art.name,
          type: art.type,
          description: (art.description ?? "").trim() || undefined,
          pinnedVersion: null,
          order: lib.artifacts.length,
        },
      ],
    });
  };

  const removeArtifact = (artifactId: string) => {
    if (!lib) return;
    setLib({ ...lib, artifacts: lib.artifacts.filter((a) => a.artifactId !== artifactId) });
  };

  const confirmClearAllMembers = () => {
    if (!lib || lib.artifacts.length === 0) return;
    setLib({ ...lib, artifacts: [] });
    setClearAllOpen(false);
  };

  const save = async () => {
    if (!lib) return;
    setSaving(true);
    const res = await fetch(`/api/v1/libraries/${lib.id}/artifacts`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lib.artifacts.map((a, i) => ({
          artifactId: a.artifactId,
          pinnedVersion: a.pinnedVersion,
          order: i,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      showError((j as { error?: { message?: string } }).error?.message ?? "Error al guardar");
      return;
    }
    savedSnapshot.current = lib.artifacts;
    await load();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 awf-fade-up">
        <span className="material-symbols-outlined text-outline animate-spin !text-[24px]">progress_activity</span>
        <p className="text-xs text-outline">Cargando biblioteca…</p>
      </div>
    );
  }

  if (!lib) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 awf-fade-up">
        <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-surface-container-low">
          <span className="material-symbols-outlined text-2xl text-outline">search_off</span>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-on-surface">Biblioteca no encontrada</p>
          <p className="text-xs text-outline">Puede haber sido eliminada o no tenés acceso.</p>
        </div>
        <Link
          href="/admin/artifact-library"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver al listado
        </Link>
      </div>
    );
  }

  const hasTypeFilters = catalogTypes.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-0 pb-10">
        <header className="awf-fade-up space-y-1">
          <Link
            href="/admin/artifact-library"
            className="mb-2 inline-flex items-center gap-1 text-xs text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Bibliotecas
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-border bg-surface-container-low">
              <span className="material-symbols-outlined text-xl text-primary-container">library_books</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-on-surface">{lib.name}</h1>
              <p className="text-[11px] text-outline">{lib.slug} · {lib.description || "Sin descripción"}</p>
            </div>
          </div>
        </header>

        {/* Transfer list: catálogo ↔ biblioteca */}
        <section
          className="awf-fade-up overflow-hidden rounded-sm border border-border bg-footer"
          aria-label="Composición de la biblioteca"
        >
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-on-surface">Artefactos</h2>
            <p className="mt-0.5 text-[11px] text-outline leading-relaxed">
              Elegí desde el catálogo (izquierda) y armá la biblioteca (derecha). Guardá cuando termines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-border">
            {/* Columna: disponibles */}
            <div className="flex min-h-0 flex-col border-b border-border lg:border-b-0">
              <div className="shrink-0 space-y-3 border-b border-border/80 bg-surface-container-low/30 px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-on-surface">Catálogo</span>
                    <span className="rounded-xs bg-surface-container-high/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-outline">
                      {filteredAvailable.length}
                      {typeFilter !== "all" || searchQuery.trim() ? ` / ${available.length}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor="library-catalog-search">Buscar en catálogo</label>
                  <div className="relative flex-1 min-w-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-outline">
                      search
                    </span>
                    <input
                      id="library-catalog-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre…"
                      autoComplete="off"
                      className="w-full rounded-sm border border-border bg-input py-2 pl-8 pr-3 text-xs text-on-surface placeholder:text-outline/45 focus:border-primary-container focus:ring-0"
                    />
                  </div>
                </div>

                {hasTypeFilters ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
                      Tipo
                    </span>
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label="Filtrar por tipo de artefacto"
                    >
                      <button
                        type="button"
                        onClick={() => setTypeFilter("all")}
                        className={`rounded-xs border px-2 py-1 text-[10px] font-medium transition-colors ${
                          typeFilter === "all"
                            ? "border-primary-container/60 bg-primary-container/15 text-primary"
                            : "border-border bg-input/60 text-outline hover:border-border-strong hover:text-on-surface"
                        }`}
                      >
                        Todos
                      </button>
                      {catalogTypes.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTypeFilter(t)}
                          className={`rounded-xs border px-2 py-1 text-[10px] font-medium transition-colors ${
                            typeFilter === t
                              ? "border-primary-container/60 bg-primary-container/15 text-primary"
                              : "border-border bg-input/60 text-outline hover:border-border-strong hover:text-on-surface"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="min-h-[min(320px,45vh)] max-h-[min(420px,50vh)] overflow-y-auto overscroll-contain ws-scrollbar px-2 py-2 sm:px-3">
                {filteredAvailable.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                    <span className="material-symbols-outlined text-outline text-[28px]">filter_alt_off</span>
                    <p className="text-xs text-outline">
                      {available.length === 0
                        ? "Todos los artefactos del catálogo ya están en la biblioteca."
                        : "Ningún resultado con estos filtros. Probá otra búsqueda o tipo."}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {filteredAvailable.map((art) => (
                      <li key={art.id}>
                        <div className="group flex items-start gap-2 rounded-xs border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-surface-container-low/50">
                          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-outline">package_2</span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-xs text-on-surface">{art.name}</span>
                            <span className="mt-0.5 inline-block rounded-[3px] bg-surface-container-high/90 px-1 py-px text-[9px] uppercase tracking-wide text-outline">
                              {typeLabel(art.type)}
                            </span>
                            <ArtifactDescriptionBlurb text={art.description} />
                          </div>
                          <button
                            type="button"
                            onClick={() => addArtifact(art)}
                            className="mt-0.5 inline-flex shrink-0 self-center items-center gap-0.5 rounded-xs border border-primary-container/40 bg-primary-container/10 px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary-container/20"
                            aria-label={`Añadir ${art.name} a la biblioteca`}
                          >
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            Añadir
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Columna: en la biblioteca */}
            <div className="flex min-h-0 flex-col bg-surface-container-low/15">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-border/80 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-on-surface">En la biblioteca</span>
                  <span className="rounded-xs bg-primary-container/15 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-primary">
                    {lib.artifacts.length}
                  </span>
                </div>
                {lib.artifacts.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setClearAllOpen(true)}
                    className="text-[10px] font-medium text-outline underline-offset-2 hover:text-error-container hover:underline"
                  >
                    Quitar todos
                  </button>
                ) : null}
              </div>

              <div className="min-h-[min(320px,45vh)] max-h-[min(420px,50vh)] overflow-y-auto overscroll-contain ws-scrollbar px-2 py-2 sm:px-3">
                {lib.artifacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                    <span className="material-symbols-outlined text-outline/80 text-[32px]">inventory_2</span>
                    <p className="text-xs text-outline max-w-[240px]">
                      Todavía no hay artefactos. Usá <span className="text-on-surface-variant">Añadir</span> en el catálogo.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {lib.artifacts.map((a, index) => (
                      <li key={a.artifactId}>
                        <div className="group flex items-start gap-2 rounded-xs border border-border/60 bg-surface-container/40 px-2 py-2 transition-colors hover:border-border-strong">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-border/80 bg-surface-container-low text-[10px] font-medium tabular-nums text-outline">
                            {index + 1}
                          </span>
                          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary-container/90">
                            package_2
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-xs text-on-surface">{a.name}</span>
                            <span className="mt-0.5 inline-block rounded-[3px] bg-surface-container-high/90 px-1 py-px text-[9px] uppercase tracking-wide text-outline">
                              {typeLabel(a.type)}
                              {a.pinnedVersion ? ` · ${a.pinnedVersion}` : ""}
                            </span>
                            <ArtifactDescriptionBlurb text={a.description} />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeArtifact(a.artifactId)}
                            className="mt-0.5 inline-flex shrink-0 self-center items-center gap-0.5 rounded-xs border border-border px-2 py-1 text-[10px] font-medium text-outline transition-colors hover:border-error-container/50 hover:bg-error-container/10 hover:text-error-container"
                            aria-label={`Quitar ${a.name}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                            Quitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {isDirty ? (
          <div className="awf-fade-up flex flex-col gap-3 rounded-sm border border-primary-container/30 bg-primary-container/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-xs text-on-surface-variant">Hay cambios sin guardar en la biblioteca.</span>
            <Button onClick={save} disabled={saving} className="!w-full sm:!w-auto">
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        title="Quitar todos los artefactos"
        description="Se vaciará la lista de la derecha. Podés deshacer cerrando sin guardar o volviendo a agregar artefactos."
        confirmLabel="Quitar todos"
        tone="danger"
        onConfirm={confirmClearAllMembers}
      />
    </div>
  );
}
