"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Constitution, SectionBlock } from "@/lib/domain/workspace-constitution";
import { buildWorkspaceMarkdown, EMPTY_CONSTITUTION, EXAMPLE_CONSTITUTION } from "@/lib/domain/workspace-constitution";
import { DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD } from "@/lib/domain/workspace-new-default-markdown";
import {
  MAX_WORKSPACE_RAW_MARKDOWN_LEN,
  resolveWorkspaceIdentityLabel,
  suggestSlugFromName,
  WORKSPACE_STACK_CATALOG,
} from "@/lib/domain/workspace-validate";
import { useAlert } from "@/components/ui/alert-provider";
import { InputField } from "@/components/ui/input-field";
import { TagInput } from "@/components/ui/tag-input";
import { WorkspaceBreadcrumb } from "./workspace-breadcrumb";
import { EditorHeader } from "./editor-header";
import { MarkdownCanvas } from "./markdown-canvas";
import { MarkdownPreview } from "./markdown-preview";
import { CompositionAside } from "./composition-aside";
import { WorkspaceStatusBar } from "./workspace-status-bar";
import { ConstitutionDrawer } from "./constitution-drawer";
import { ArtifactPickerDrawer } from "./artifact-picker-drawer";

type MeUser = { id: string; email: string; name: string | null; role: string };

type WorkspaceArtifactRow = {
  artifactId: string;
  name: string;
  type: string;
  pinnedVersion: string | null;
  order: number;
};

type WorkspacePayload = {
  id: string;
  slug: string;
  name: string;
  description: string;
  semver: string;
  status: "draft" | "active" | "archived";
  stacks: string[];
  constitution: Constitution;
  rawMarkdown: string;
  customMarkdown: boolean;
  ownerId: string;
  artifacts: WorkspaceArtifactRow[];
  updatedAt: string;
};

type CatalogArtifact = { id: string; name: string; type: string; publishedVersions: string[] };

const DEFAULT_NEW_WORKSPACE_DISPLAY_NAME = "Nuevo workspace";

function defaultDisplayNameFromMe(me: MeUser): string {
  const n = me.name?.trim();
  if (n) return n;
  const local = me.email.split("@")[0]?.trim() ?? "";
  if (!local) return DEFAULT_NEW_WORKSPACE_DISPLAY_NAME;
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

/* ── Drawer wrapper using <dialog> for consistency ── */
function SideDrawer({ open, onClose, title, width, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      className={`m-0 ml-auto h-dvh max-h-dvh ${width ?? "w-[380px]"} max-w-[90vw] bg-background border-l border-border text-on-surface shadow-2xl [&::backdrop]:bg-black/50 [&:not([open])]:hidden overflow-hidden flex flex-col p-0`}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
    >
      <header className="h-10 px-4 border-b border-border flex items-center justify-between shrink-0">
        <span className="label-xs-uppercase tracking-widest">{title}</span>
        <button type="button" className="text-outline hover:text-on-surface transition-colors" onClick={onClose}>
          <span className="material-symbols-outlined !text-[18px]">close</span>
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function WorkspaceEditor({ mode, workspaceId }: { mode: "create" | "edit"; workspaceId?: string }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showError } = useAlert();

  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<CatalogArtifact[]>([]);

  const [name, setName] = useState(() => (mode === "create" ? DEFAULT_NEW_WORKSPACE_DISPLAY_NAME : ""));
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [semver, setSemver] = useState("0.1.0");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [stacks, setStacks] = useState<string[]>([]);
  const [constitution, setConstitution] = useState<Constitution>(() =>
    mode === "create" ? structuredClone(EXAMPLE_CONSTITUTION) : EMPTY_CONSTITUTION,
  );
  const [rawMarkdown, setRawMarkdown] = useState(() =>
    mode === "create" ? DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD : "",
  );
  const [customMarkdown, setCustomMarkdown] = useState(() => mode === "create");
  const [ownerId, setOwnerId] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [assoc, setAssoc] = useState<Record<string, { pinnedVersion: string }>>({});
  const selectedArtifactIds = useMemo(() => new Set(Object.keys(assoc)), [assoc]);

  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [constitutionOpen, setConstitutionOpen] = useState(false);
  const [artifactPickerOpen, setArtifactPickerOpen] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [stackOpen, setStackOpen] = useState(false);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);

  type LinkedLib = { libraryId: string; name: string; slug: string; artifactCount: number; order: number };
  const [linkedLibraries, setLinkedLibraries] = useState<LinkedLib[]>([]);
  type AvailableLib = { id: string; slug: string; name: string; artifactCount: number };
  const [availableLibraries, setAvailableLibraries] = useState<AvailableLib[]>([]);

  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedMd = useRef("");

  // ── Load helpers ──
  const loadMe = useCallback(async () => {
    const res = await fetch("/api/v1/auth/me", { credentials: "include" });
    const j = (await res.json()) as { user?: MeUser };
    if (res.ok && j.user) {
      setMe(j.user);
      if (mode === "create") setOwnerId(j.user.id);
    }
  }, [mode]);

  const loadCatalog = useCallback(async () => {
    const res = await fetch("/api/v1/artifacts?limit=100", { credentials: "include" });
    const j = (await res.json()) as {
      items?: Array<{ id: string; name: string; type: string; versions?: { version: string }[] }>;
    };
    if (res.ok)
      setCatalog(
        (j.items ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          publishedVersions: (i.versions ?? []).map((v) => v.version),
        })),
      );
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const res = await fetch(`/api/v1/workspaces/${workspaceId}`, { credentials: "include" });
    const j = (await res.json()) as { workspace?: WorkspacePayload; error?: { message?: string } };
    if (!res.ok) {
      showError(j.error?.message ?? "Error al cargar el workspace.");
      setLoading(false);
      return;
    }
    const w = j.workspace!;
    const loadedName = w.name?.trim() ?? "";
    const loadedSlug = w.slug?.trim() ?? "";
    const resolved = resolveWorkspaceIdentityLabel(loadedName, loadedSlug);
    setName(resolved || loadedName || loadedSlug);
    setSlug(loadedSlug);
    setDescription(w.description);
    setSemver(w.semver);
    setStatus(w.status);
    setStacks(w.stacks);
    setConstitution(w.constitution);
    setRawMarkdown(w.rawMarkdown);
    setCustomMarkdown(w.customMarkdown);
    setOwnerId(w.ownerId);
    setUpdatedAt(w.updatedAt ?? null);
    lastSavedMd.current = w.rawMarkdown;
    const nextAssoc: Record<string, { pinnedVersion: string }> = {};
    for (const a of w.artifacts) nextAssoc[a.artifactId] = { pinnedVersion: a.pinnedVersion ?? "" };
    setAssoc(nextAssoc);
    setLoading(false);
  }, [workspaceId, showError]);

  const loadLinkedLibraries = useCallback(async () => {
    if (!workspaceId) return;
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/libraries`, { credentials: "include" });
    const j = (await res.json()) as { items?: LinkedLib[] };
    if (res.ok) setLinkedLibraries(j.items ?? []);
  }, [workspaceId]);

  const loadAvailableLibraries = useCallback(async () => {
    const res = await fetch("/api/v1/libraries?limit=100", { credentials: "include" });
    const j = (await res.json()) as { items?: AvailableLib[] };
    if (res.ok) setAvailableLibraries(j.items ?? []);
  }, []);

  useEffect(() => { void loadMe(); void loadCatalog(); void loadAvailableLibraries(); }, [loadMe, loadCatalog, loadAvailableLibraries]);
  useEffect(() => {
    if (mode === "edit" && workspaceId) {
      void loadWorkspace();
      void loadLinkedLibraries();
    }
  }, [mode, workspaceId, loadWorkspace, loadLinkedLibraries]);

  /** En crear: nombre visible desde el primer render; al cargar `/me`, personalizar si sigue el placeholder. */
  useEffect(() => {
    if (mode !== "create" || !me) return;
    setName((prev) => {
      const untouched = prev === DEFAULT_NEW_WORKSPACE_DISPLAY_NAME || !prev.trim();
      if (!untouched) return prev;
      return defaultDisplayNameFromMe(me);
    });
  }, [mode, me]);

  // ── Compute markdown ──
  const workspaceDisplayName = useMemo(() => resolveWorkspaceIdentityLabel(name, slug), [name, slug]);

  const previewMd = useMemo(() => {
    if (customMarkdown) return rawMarkdown;
    const nm = workspaceDisplayName || "workspace";
    return buildWorkspaceMarkdown(constitution, { name: nm, slug, semver });
  }, [customMarkdown, rawMarkdown, constitution, workspaceDisplayName, slug, semver]);

  const displayMd = customMarkdown ? rawMarkdown : previewMd;

  function handleMarkdownChange(val: string) {
    setRawMarkdown(val);
    setCustomMarkdown(true);
  }

  // ── Autosave (only draft, debounce 2s) ──
  useEffect(() => {
    if (mode !== "edit" || !workspaceId || status !== "draft") return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const md = customMarkdown ? rawMarkdown : buildWorkspaceMarkdown(constitution, { name: workspaceDisplayName || "workspace", slug, semver });
    if (md === lastSavedMd.current) return;
    autosaveTimer.current = setTimeout(async () => {
      setAutosaveState("saving");
      try {
        const nameFallback = name.trim() || "workspace";
        const slugToSend = (slug.trim() || suggestSlugFromName(nameFallback)).trim();
        if (!slug.trim()) setSlug(slugToSend);
        const effectiveName = resolveWorkspaceIdentityLabel(name, slugToSend);
        if (!effectiveName) {
          setAutosaveState("error");
          return;
        }
        const body = {
          name: effectiveName,
          slug: slugToSend,
          description,
          semver,
          status,
          stacks,
          constitution,
          rawMarkdown: customMarkdown ? rawMarkdown : undefined,
          customMarkdown,
        };
        const res = await fetch(`/api/v1/workspaces/${workspaceId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
          const j = (await res.json()) as { workspace?: WorkspacePayload };
          if (j.workspace?.updatedAt) setUpdatedAt(j.workspace.updatedAt);
          if (j.workspace?.slug) setSlug(j.workspace.slug);
          lastSavedMd.current = md;
          setAutosaveState("saved");
        } else {
          setAutosaveState("error");
        }
      } catch {
        setAutosaveState("error");
      }
    }, 2000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [rawMarkdown, constitution, name, slug, semver, description, stacks, status, customMarkdown, mode, workspaceId, workspaceDisplayName]);

  // ── Artifact helpers ──
  function toggleArtifact(id: string, on: boolean) {
    setAssoc((prev) => {
      const next = { ...prev };
      if (on) next[id] = { pinnedVersion: prev[id]?.pinnedVersion ?? "" };
      else delete next[id];
      return next;
    });
  }

  function setPinned(id: string, v: string) {
    setAssoc((prev) => ({ ...prev, [id]: { pinnedVersion: v } }));
  }

  async function persistLibraries(targetId: string) {
    const items = linkedLibraries.map((l, i) => ({ libraryId: l.libraryId, order: i }));
    const res = await fetch(`/api/v1/workspaces/${targetId}/libraries`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const j = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) throw new Error(j.error?.message ?? "Error al guardar bibliotecas");
  }

  function addLibrary(lib: AvailableLib) {
    if (linkedLibraries.some((l) => l.libraryId === lib.id)) return;
    setLinkedLibraries((prev) => [...prev, { libraryId: lib.id, name: lib.name, slug: lib.slug, artifactCount: lib.artifactCount, order: prev.length }]);
  }

  function removeLibrary(libraryId: string) {
    setLinkedLibraries((prev) => prev.filter((l) => l.libraryId !== libraryId));
  }

  async function persistArtifacts(targetId: string) {
    const items = Object.entries(assoc).map(([artifactId, meta], index) => ({ artifactId, pinnedVersion: meta.pinnedVersion.trim() || null, order: index }));
    const res = await fetch(`/api/v1/workspaces/${targetId}/artifacts`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const j = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) throw new Error(j.error?.message ?? "Error al guardar artefactos");
  }

  // ── Save ──
  async function saveWorkspace(targetStatus?: typeof status) {
    setSaving(true);
    try {
      const effectiveName = resolveWorkspaceIdentityLabel(name, slug) || name.trim();
      if (!effectiveName || effectiveName === "workspace") {
        const fallback = resolveWorkspaceIdentityLabel(name, slug);
        if (!fallback) {
          showError(
            "Indicá un nombre o slug válido en Identidad (panel derecho → Editar). Los valores solo con guiones (---) cuentan como vacíos.",
          );
          setSaving(false);
          return;
        }
      }
      const slugToSend = (slug.trim() || suggestSlugFromName(effectiveName || "workspace")).trim();
      if (!slug.trim()) setSlug(slugToSend);
      const nameToSend = resolveWorkspaceIdentityLabel(effectiveName, slugToSend);
      if (!nameToSend) {
        showError(
          "Indicá un nombre o slug válido en Identidad (panel derecho → Editar). Los valores solo con guiones (---) cuentan como vacíos.",
        );
        setSaving(false);
        return;
      }
      if (customMarkdown && rawMarkdown.length > MAX_WORKSPACE_RAW_MARKDOWN_LEN) {
        showError(
          `El Markdown supera el máximo permitido (${MAX_WORKSPACE_RAW_MARKDOWN_LEN.toLocaleString("es-AR")} caracteres). Acortá el playbook o desactivá Markdown personalizado para regenerar desde la constitución.`,
        );
        setSaving(false);
        return;
      }
      const statusToSend = targetStatus ?? status;
      const body = {
        name: nameToSend,
        slug: slugToSend,
        description,
        semver,
        status: statusToSend,
        stacks,
        constitution,
        rawMarkdown: customMarkdown ? rawMarkdown : undefined,
        customMarkdown,
      };

      if (mode === "create" || !workspaceId) {
        const res = await fetch("/api/v1/workspaces", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const j = (await res.json()) as { workspace?: WorkspacePayload; error?: { message?: string } };
        if (!res.ok) throw new Error(j.error?.message ?? "Error al crear");
        const created = j.workspace!;
        if (created.slug) setSlug(created.slug);
        if (created.name?.trim()) setName(created.name);
        await persistArtifacts(created.id);
        await persistLibraries(created.id);
        router.push(`/admin/workspaces/${created.id}/edit`);
        return;
      }

      const res = await fetch(`/api/v1/workspaces/${workspaceId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json()) as { workspace?: WorkspacePayload; error?: { message?: string } };
      if (!res.ok) throw new Error(j.error?.message ?? "Error al guardar");
      await persistArtifacts(workspaceId);
      await persistLibraries(workspaceId);
      if (j.workspace?.updatedAt) setUpdatedAt(j.workspace.updatedAt);
      setStatus(j.workspace!.status);
      setSlug(j.workspace!.slug);
      if (j.workspace?.name?.trim()) setName(j.workspace.name);
      lastSavedMd.current = customMarkdown
        ? rawMarkdown
        : buildWorkspaceMarkdown(constitution, {
            name: j.workspace!.name?.trim() || workspaceDisplayName || "workspace",
            slug: j.workspace!.slug,
            semver: j.workspace!.semver,
          });
      setAutosaveState("saved");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadJson() {
    if (!workspaceId) return;
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/awf-workspace.json`, { credentials: "include" });
    if (!res.ok) {
      showError("No se pudo descargar el JSON.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "awf.workspace.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Toolbar insert ──
  function handleInsert(prefix: string, suffix?: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const md = customMarkdown ? rawMarkdown : displayMd;
    const selected = md.substring(start, end);
    const replacement = `${prefix}${selected}${suffix ?? ""}`;
    const next = md.substring(0, start) + replacement + md.substring(end);
    setRawMarkdown(next);
    setCustomMarkdown(true);
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = start + prefix.length + selected.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  }

  // ── Artifact list for aside ──
  const artifactList = useMemo(() => {
    return Object.entries(assoc).map(([id, meta]) => {
      const cat = catalog.find((c) => c.id === id);
      return { artifactId: id, name: cat?.name ?? id, type: cat?.type ?? "unknown", pinnedVersion: meta.pinnedVersion || null };
    });
  }, [assoc, catalog]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-outline animate-spin !text-[24px]">progress_activity</span>
          <p className="text-[11px] text-outline font-mono">Cargando workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WorkspaceBreadcrumb
        name={name}
        slug={slug}
        status={status}
        lastSavedAt={updatedAt}
        onEditIdentity={() => setIdentityOpen(true)}
      />
      <EditorHeader activeTab={activeTab} onTabChange={setActiveTab} onSave={() => void saveWorkspace()} saving={saving} onInsert={handleInsert} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {activeTab === "editor" ? (
          <MarkdownCanvas value={displayMd} onChange={handleMarkdownChange} textareaRef={textareaRef} />
        ) : (
          <MarkdownPreview value={displayMd} />
        )}

        <CompositionAside
          name={name}
          slug={slug}
          semver={semver}
          status={status}
          stacks={stacks}
          artifacts={artifactList}
          linkedLibraries={linkedLibraries}
          constitution={constitution}
          workspaceId={workspaceId}
          onEditIdentity={() => setIdentityOpen(true)}
          onEditStack={() => setStackOpen(true)}
          onEditConstitution={() => setConstitutionOpen(true)}
          onEditArtifacts={() => setArtifactPickerOpen(true)}
          onEditLibraries={() => setLibraryPickerOpen(true)}
          onDownloadJson={() => void downloadJson()}
        />
      </div>

      <WorkspaceStatusBar status={status} slug={slug} charCount={displayMd.length} autosaveState={autosaveState} />

      {/* Identity drawer */}
      <SideDrawer open={identityOpen} onClose={() => setIdentityOpen(false)} title="Identidad">
        <div className="flex-1 overflow-y-auto ws-scrollbar p-4 space-y-3">
          <InputField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <InputField
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            trailing={
              <button type="button" className="text-[10px] text-primary-container hover:underline" onClick={() => setSlug(suggestSlugFromName(name))}>
                Auto
              </button>
            }
          />
          <label className="flex flex-col gap-1 text-[10px] text-outline uppercase tracking-wider pl-1">
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-input border border-border rounded text-sm text-on-surface px-3 py-2" />
          </label>
          <InputField label="Versión (SemVer)" value={semver} onChange={(e) => setSemver(e.target.value)} />
          <label className="flex flex-col gap-1 text-[10px] text-outline uppercase tracking-wider pl-1">
            Estado
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full bg-input border border-border rounded text-sm px-3 py-2 text-on-surface">
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <InputField
            label="Propietario"
            value={me && ownerId === me.id ? `${me.email} (${me.role})` : ownerId || "—"}
            readOnly
          />
        </div>
        <footer className="p-3 border-t border-border bg-input shrink-0">
          <button
            type="button"
            className="w-full py-2 bg-transparent border border-border hover:border-primary-container text-on-surface rounded text-[10px] font-bold font-[family-name:var(--font-label)] uppercase tracking-widest transition-all"
            onClick={() => setIdentityOpen(false)}
          >
            Cerrar
          </button>
        </footer>
      </SideDrawer>

      {/* Stack drawer */}
      <SideDrawer open={stackOpen} onClose={() => setStackOpen(false)} title="Stack técnico">
        <div className="flex-1 overflow-y-auto ws-scrollbar p-4">
          <TagInput label="Stacks" value={stacks} onChange={setStacks} suggestions={WORKSPACE_STACK_CATALOG} />
        </div>
        <footer className="p-3 border-t border-border bg-input shrink-0">
          <button
            type="button"
            className="w-full py-2 bg-transparent border border-border hover:border-primary-container text-on-surface rounded text-[10px] font-bold font-[family-name:var(--font-label)] uppercase tracking-widest transition-all"
            onClick={() => setStackOpen(false)}
          >
            Cerrar
          </button>
        </footer>
      </SideDrawer>

      <ConstitutionDrawer open={constitutionOpen} onClose={() => setConstitutionOpen(false)} constitution={constitution} onChange={setConstitution} />
      <ArtifactPickerDrawer open={artifactPickerOpen} onClose={() => setArtifactPickerOpen(false)} catalog={catalog} selectedIds={selectedArtifactIds} assoc={assoc} onToggle={toggleArtifact} onPinChange={setPinned} />

      {/* Library picker drawer */}
      <SideDrawer open={libraryPickerOpen} onClose={() => setLibraryPickerOpen(false)} title="Bibliotecas">
        <div className="flex-1 overflow-y-auto ws-scrollbar p-4 space-y-4">
          {linkedLibraries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-wider text-outline">Enlazadas</h4>
              {linkedLibraries.map((l) => (
                <div key={l.libraryId} className="flex items-center gap-2 p-2 bg-footer border border-border rounded">
                  <span className="material-symbols-outlined text-[14px] text-outline">library_books</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-on-surface">{l.name}</span>
                  <button type="button" onClick={() => removeLibrary(l.libraryId)} className="text-outline hover:text-error-container transition-colors">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-outline">Disponibles</h4>
            {availableLibraries
              .filter((al) => !linkedLibraries.some((ll) => ll.libraryId === al.id))
              .map((al) => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => addLibrary(al)}
                  className="w-full flex items-center gap-2 p-2 bg-footer border border-border rounded hover:border-border-strong transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[14px] text-outline">library_books</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] text-on-surface truncate">{al.name}</span>
                    <span className="text-[9px] text-outline">{al.slug} · {al.artifactCount} art.</span>
                  </div>
                  <span className="text-[9px] text-primary font-medium">+ Enlazar</span>
                </button>
              ))}
            {availableLibraries.filter((al) => !linkedLibraries.some((ll) => ll.libraryId === al.id)).length === 0 && (
              <p className="text-[9px] text-outline italic">No hay más bibliotecas disponibles.</p>
            )}
          </div>
        </div>
        <footer className="p-3 border-t border-border bg-input shrink-0">
          <button
            type="button"
            className="w-full py-2 bg-transparent border border-border hover:border-primary-container text-on-surface rounded text-[10px] font-bold font-[family-name:var(--font-label)] uppercase tracking-widest transition-all"
            onClick={() => setLibraryPickerOpen(false)}
          >
            Cerrar
          </button>
        </footer>
      </SideDrawer>
    </div>
  );
}
