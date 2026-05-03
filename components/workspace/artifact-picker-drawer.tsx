"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InputField } from "@/components/ui/input-field";
import { MultiselectTable } from "@/components/ui/multiselect-table";
import {
  WORKSPACE_VERSION_SELECT_LATEST,
  workspaceArtifactPinSelectModel,
} from "@/lib/domain/workspace-artifact-version-pin";

type CatalogArtifact = { id: string; name: string; type: string; publishedVersions: string[] };

function VersionPinSelect({
  pinnedVersion,
  publishedVersions,
  disabled,
  onChange,
}: {
  pinnedVersion: string;
  publishedVersions: string[];
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const { selectValue, legacyOption, legacyPin } = workspaceArtifactPinSelectModel(pinnedVersion, publishedVersions);

  return (
    <select
      aria-label="Versión del artefacto"
      className="w-full min-w-[140px] max-w-[220px] bg-input border border-border rounded px-2 py-1.5 text-[11px] font-mono text-on-surface disabled:opacity-90 disabled:text-on-surface/70"
      value={selectValue}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === WORKSPACE_VERSION_SELECT_LATEST ? "" : v);
      }}
    >
      <option value={WORKSPACE_VERSION_SELECT_LATEST}>latest</option>
      {publishedVersions.map((ver) => (
        <option key={ver} value={ver}>
          {ver}
        </option>
      ))}
      {legacyOption ? (
        <option value={legacyPin}>
          {legacyPin} (no en catálogo)
        </option>
      ) : null}
    </select>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  catalog: CatalogArtifact[];
  selectedIds: Set<string>;
  assoc: Record<string, { pinnedVersion: string }>;
  onToggle: (id: string, on: boolean) => void;
  onPinChange: (id: string, v: string) => void;
};

export function ArtifactPickerDrawer({ open, onClose, catalog, selectedIds, assoc, onToggle, onPinChange }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");

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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return catalog;
    return catalog.filter((a) => a.name.toLowerCase().includes(s) || a.type.toLowerCase().includes(s));
  }, [catalog, q]);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      className="m-0 ml-auto h-dvh max-h-dvh w-[420px] max-w-[90vw] bg-background border-l border-border text-on-surface shadow-2xl [&::backdrop]:bg-black/50 [&:not([open])]:hidden overflow-hidden flex flex-col p-0"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
    >
      <header className="h-10 px-4 border-b border-border flex items-center justify-between shrink-0">
        <span className="label-xs-uppercase tracking-widest">Asociar artefactos</span>
        <button type="button" className="text-outline hover:text-on-surface transition-colors" onClick={onClose}>
          <span className="material-symbols-outlined !text-[18px]">close</span>
        </button>
      </header>

      <div className="p-4 border-b border-border shrink-0">
        <InputField label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} placeholder="nombre o tipo" />
      </div>

      <div className="flex-1 overflow-y-auto ws-scrollbar p-4">
        <MultiselectTable<CatalogArtifact>
          rows={filtered}
          selectedIds={selectedIds}
          onToggle={onToggle}
          emptyMessage="No hay artefactos o no coinciden."
          columns={[
            { id: "name", header: "Nombre", cell: (r) => <span className="font-mono text-[11px]">{r.name}</span> },
            {
              id: "type",
              header: "Tipo",
              cell: (r) => <span className="text-on-surface/75">{r.type}</span>,
            },
            {
              id: "pin",
              header: "Versión",
              className: "min-w-[120px]",
              cell: (r) => (
                <VersionPinSelect
                  pinnedVersion={assoc[r.id]?.pinnedVersion ?? ""}
                  publishedVersions={r.publishedVersions}
                  disabled={!selectedIds.has(r.id)}
                  onChange={(v) => onPinChange(r.id, v)}
                />
              ),
            },
          ]}
        />
      </div>

      <footer className="p-3 border-t border-border bg-input shrink-0">
        <button
          type="button"
          className="w-full py-2 bg-transparent border border-border hover:border-primary-container text-on-surface rounded text-[10px] font-bold font-[family-name:var(--font-label)] uppercase tracking-widest transition-all"
          onClick={onClose}
        >
          Cerrar
        </button>
      </footer>
    </dialog>
  );
}
