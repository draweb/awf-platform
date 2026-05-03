"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAlert } from "@/components/ui/alert-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InputField } from "@/components/ui/input-field";

type LibraryItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  ownerId: string;
  updatedAt: string;
  artifactCount: number;
};

const CARD_ACCENTS = [
  { color: "text-primary-container", gradient: "from-primary-container/10" },
  { color: "text-tertiary", gradient: "from-tertiary/10" },
  { color: "text-secondary", gradient: "from-secondary/10" },
  { color: "text-primary", gradient: "from-primary/10" },
  { color: "text-on-surface-variant", gradient: "from-on-surface-variant/10" },
] as const;

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function relativeTimeEs(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (sec < 60) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const h = Math.round(min / 60);
  if (h < 48) return rtf.format(-h, "hour");
  return rtf.format(-Math.round(h / 24), "day");
}

/* ── Create Modal ── */

function CreateLibraryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (libraryId: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const { showError } = useAlert();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  /** Si el usuario editó el slug, deja de regenerarlo desde el nombre. */
  const [slugLocked, setSlugLocked] = useState(false);
  const [desc, setDesc] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!slugLocked) setSlug(slugify(name));
  }, [name, slugLocked]);

  const effectiveSlug = slug.trim() || slugify(name);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setName("");
      setSlug("");
      setSlugLocked(false);
      setDesc("");
      setPending(false);
      el.showModal();
      setTimeout(() => nameRef.current?.focus(), 60);
    }
    if (!open && el.open) el.close();
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !effectiveSlug) return;
    setPending(true);
    try {
      const res = await fetch("/api/v1/libraries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: effectiveSlug, description: desc.trim() }),
      });
      const j = (await res.json()) as { library?: { id: string }; error?: { message?: string } };
      if (!res.ok) {
        setPending(false);
        showError(j.error?.message ?? "Error al crear biblioteca");
        return;
      }
      const id = j.library?.id;
      if (!id) {
        setPending(false);
        showError("Respuesta inválida del servidor");
        return;
      }
      onCreated(id);
    } catch {
      setPending(false);
      showError("No se pudo crear la biblioteca");
    }
  };

  return (
    <dialog
      ref={ref}
      aria-busy={pending}
      className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(480px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border-strong bg-surface-container p-0 text-on-surface shadow-2xl [&::backdrop]:bg-black/65 [&::backdrop]:backdrop-blur-[2px]"
      onCancel={(e) => {
        if (pending) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="relative">
        {pending ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-sm bg-surface-container/90 backdrop-blur-sm"
            aria-live="polite"
          >
            <span className="material-symbols-outlined animate-spin text-3xl text-primary-container">
              progress_activity
            </span>
            <p className="text-xs font-medium text-on-surface">Creando biblioteca…</p>
            <p className="text-[10px] text-outline">No cierres esta ventana</p>
          </div>
        ) : null}
        <div className="px-5 pt-5 pb-4 border-b border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs border border-border bg-surface-container-low">
              <span className="material-symbols-outlined text-lg text-primary-container">library_books</span>
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Nueva biblioteca</h2>
              <p className="text-[11px] text-outline">Agrupá artefactos para vincular a workspaces.</p>
            </div>
          </div>

          <InputField
            ref={nameRef}
            label="Nombre"
            required
            placeholder="Ej. Frontend essentials"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <InputField
            label="Slug"
            placeholder="se genera desde el nombre"
            value={slug}
            onChange={(e) => {
              setSlugLocked(true);
              setSlug(e.target.value);
            }}
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider pl-1">
              Descripción
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Opcional — describe el propósito de esta biblioteca"
              className="w-full bg-input border border-border rounded-sm text-sm font-mono text-on-surface focus:ring-0 focus:border-primary-container transition-colors placeholder:text-outline/40 px-3 py-2 resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 bg-surface-container-low/40">
          <Button type="button" variant="ghost" className="!w-full sm:!w-auto sm:min-w-[100px]" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="!w-full sm:!w-auto sm:min-w-[120px]" disabled={pending || !name.trim()}>
            {pending ? "Creando…" : "Crear biblioteca"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/* ── Page ── */

export default function ArtifactLibraryPage() {
  const router = useRouter();
  const { showError } = useAlert();

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LibraryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/libraries", { credentials: "include" });
    const j = (await res.json()) as { items?: LibraryItem[]; error?: { message?: string } };
    if (!res.ok) {
      showError(j.error?.message ?? "No se pudo cargar las bibliotecas");
      setItems([]);
      return;
    }
    setItems(j.items ?? []);
  }, [showError]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/v1/libraries/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
    setDeleting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      showError((j as { error?: { message?: string } }).error?.message ?? "Error al eliminar");
    }
    setDeleteTarget(null);
    await load();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-0 pb-10">
        <header className="awf-fade-up space-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">
            Artifact library
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-outline">
            Agrupá artefactos en bibliotecas reutilizables. Vincularlas a un workspace entrega
            todos sus miembros al CLI con un solo enlace.
          </p>
        </header>

        {/* Grid / empty */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 awf-fade-up">
            <span className="material-symbols-outlined text-outline animate-spin !text-[24px]">progress_activity</span>
            <p className="text-xs text-outline">Cargando bibliotecas…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="awf-fade-up flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-surface-container-low">
              <span className="material-symbols-outlined text-2xl text-outline">library_books</span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-on-surface">Sin bibliotecas</p>
              <p className="text-xs text-outline max-w-xs">
                Creá tu primera biblioteca para agrupar artefactos y vincularlos a workspaces de forma eficiente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-sm border border-primary-container/50 bg-primary-container/10 px-4 py-2 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary-container/20"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nueva biblioteca
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between awf-fade-up">
              <span className="text-xs text-outline">
                {items.length} biblioteca{items.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-sm border border-primary-container/50 bg-primary-container/10 px-4 py-2 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary-container/20"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Nueva biblioteca
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((lib, i) => {
                const accent = CARD_ACCENTS[i % CARD_ACCENTS.length]!;
                return (
                  <Link
                    key={lib.id}
                    href={`/admin/artifact-library/${lib.id}`}
                    className={`group relative flex flex-col overflow-hidden rounded-sm border border-border bg-footer transition-all duration-300 hover:border-border-strong hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)] awf-fade-up ${
                      i > 0 ? "awf-fade-up-delay" : ""
                    }`}
                    style={i > 1 ? { animationDelay: `${Math.min(i * 60, 300)}ms` } : undefined}
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent.gradient} to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                    <div className="relative flex flex-1 flex-col p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-border bg-surface-container-low transition-colors duration-200 group-hover:bg-surface-container">
                          <span
                            className={`material-symbols-outlined text-xl ${accent.color} transition-transform duration-300 group-hover:scale-110`}
                          >
                            library_books
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-sm font-semibold text-on-surface">{lib.name}</h2>
                          <span className="text-[10px] text-outline">{lib.slug}</span>
                        </div>
                      </div>

                      <p className="flex-1 text-xs leading-relaxed text-on-surface-variant line-clamp-2">
                        {lib.description || "Sin descripción"}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-outline">
                          {lib.artifactCount} artefacto{lib.artifactCount !== 1 ? "s" : ""} · {relativeTimeEs(lib.updatedAt)}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(lib); }}
                            className="text-outline opacity-0 group-hover:opacity-100 hover:text-error-container transition-all duration-200"
                            aria-label={`Eliminar ${lib.name}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-outline transition-colors duration-200 group-hover:text-primary">
                            <span>Abrir</span>
                            <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                              arrow_forward
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Info footer */}
        <section className="awf-fade-up rounded-sm border border-border bg-footer p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-outline">
                support_agent
              </span>
              <div>
                <p className="text-sm font-medium text-on-surface">
                  ¿Cómo funcionan las bibliotecas?
                </p>
                <p className="mt-0.5 text-xs text-outline leading-relaxed">
                  Cada biblioteca agrupa artefactos. Al vincularla a un workspace, el CLI recibe todos
                  los miembros fusionados sin ver el concepto de biblioteca.
                </p>
              </div>
            </div>
            <Link
              href="/admin/artifacts"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-primary-container/50 bg-primary-container/10 px-4 py-2 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary-container/20"
            >
              <span className="material-symbols-outlined text-sm">package_2</span>
              Explorer
            </Link>
          </div>
        </section>
      </div>

      <CreateLibraryModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(libraryId) => {
          setShowCreate(false);
          router.push(`/admin/artifact-library/${libraryId}?pick=1`);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Eliminar "${deleteTarget?.name ?? ""}"`}
        description="Se eliminará la biblioteca y sus vínculos con workspaces. Los artefactos no se borran."
        confirmLabel="Eliminar"
        tone="danger"
        pending={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
