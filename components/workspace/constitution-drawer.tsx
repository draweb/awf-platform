"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InputField } from "@/components/ui/input-field";
import type { Constitution, SectionBlock } from "@/lib/domain/workspace-constitution";

function emptyBlock(): SectionBlock {
  return { title: "", body: "", bullets: [] };
}

const textareaReadability =
  "min-h-[5rem] w-full resize-y rounded-md border border-border-strong bg-input px-3 py-2.5 " +
  "text-[13px] leading-relaxed text-on-surface placeholder:text-outline/45 " +
  "font-mono tracking-normal " +
  "transition-colors focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/35";

const fieldCaption =
  "flex flex-col gap-2 text-[11px] font-medium uppercase tracking-wide text-on-surface/80";

const titleInputClasses =
  "font-sans !text-[13px] !tracking-normal !rounded-md !border-border-strong";

function BlockFields({
  block,
  onChange,
  variant,
  sectionHeading,
  blockNumber,
  onRemove,
}: {
  block: SectionBlock;
  onChange: (b: SectionBlock) => void;
  variant: "pillar" | "numbered";
  sectionHeading?: string;
  blockNumber?: number;
  onRemove?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const bulletsText = (block.bullets ?? []).join("\n");
  const previewTitle = block.title.trim() || "(sin título)";

  const headerToggle = (
    <button
      type="button"
      className="flex w-full min-w-0 items-start gap-2 rounded-md text-left outline-none hover:bg-surface-container-low/80 focus-visible:ring-1 focus-visible:ring-primary-container/50"
      onClick={() => setExpanded((e) => !e)}
      aria-expanded={expanded}
    >
      <span className="material-symbols-outlined shrink-0 !text-[20px] text-outline" aria-hidden>
        {expanded ? "expand_less" : "expand_more"}
      </span>
      <span className="min-w-0 flex-1">
        {variant === "pillar" && sectionHeading ? (
          <>
            <span className="label-xs-uppercase text-primary">{sectionHeading}</span>
            {!expanded && (
              <p className="mt-1 truncate text-[12px] font-mono text-on-surface-variant">{previewTitle}</p>
            )}
          </>
        ) : (
          <>
            <span className="flex flex-wrap items-center gap-2">
              <span
                className="tabular-nums inline-flex min-w-[2.25rem] justify-center rounded-md bg-surface-container-high px-2 py-1 text-[11px] font-mono text-primary"
                aria-hidden
              >
                {blockNumber != null ? String(blockNumber).padStart(2, "0") : "—"}
              </span>
              <span className="label-xs-uppercase text-outline">Bloque</span>
            </span>
            {!expanded && (
              <p className="mt-1 truncate text-[12px] font-mono text-on-surface-variant">{previewTitle}</p>
            )}
          </>
        )}
      </span>
    </button>
  );

  return (
    <article className="rounded-lg border border-border-strong bg-footer p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-1 border-b border-border/70 pb-3">
        <div className="min-w-0 flex-1 space-y-2">
          {headerToggle}
          {expanded && variant === "pillar" && sectionHeading && (
            <p className="pl-8 text-[11px] leading-snug text-outline">
              Equivale a <span className="font-mono text-on-surface-variant">## {sectionHeading}</span> en el Markdown
              exportado del workspace.
            </p>
          )}
          {expanded && variant === "numbered" && (
            <p className="pl-8 text-[11px] leading-snug text-outline">
              En el export: <span className="font-mono text-on-surface-variant">### título</span> del campo Título, más
              cuerpo y viñetas bajo la sección padre.
            </p>
          )}
        </div>
        {onRemove ? (
          <>
            <button
              type="button"
              className="shrink-0 rounded-md p-1.5 text-outline transition-colors hover:bg-error-container/25 hover:text-error"
              aria-label="Eliminar bloque"
              title="Eliminar bloque"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmRemove(true);
              }}
            >
              <span className="material-symbols-outlined !text-[18px]">delete_outline</span>
            </button>
            <ConfirmDialog
              open={confirmRemove}
              onClose={() => setConfirmRemove(false)}
              title="Eliminar bloque"
              description={`¿Eliminar el bloque "${previewTitle}" de la constitución? Esta acción no se puede deshacer.`}
              confirmLabel="Eliminar"
              tone="danger"
              onConfirm={() => {
                setConfirmRemove(false);
                onRemove();
              }}
            />
          </>
        ) : null}
      </div>

      {expanded ? (
        <>
          <div className="space-y-5">
            <InputField
              label="Título"
              labelClassName="!text-[11px] !font-semibold !text-on-surface/85 !tracking-wide"
              value={block.title}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              className={titleInputClasses}
            />
            <label className={fieldCaption}>
              Cuerpo (Markdown)
              <textarea
                value={block.body}
                onChange={(e) => onChange({ ...block, body: e.target.value })}
                rows={4}
                spellCheck={false}
                placeholder="Párrafos en Markdown…"
                className={textareaReadability}
              />
            </label>
            <label className={fieldCaption}>
              Viñetas (una por línea)
              <textarea
                value={bulletsText}
                onChange={(e) =>
                  onChange({
                    ...block,
                    bullets: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                  })
                }
                rows={3}
                spellCheck={false}
                placeholder="Un ítem por línea"
                className={textareaReadability}
              />
            </label>
          </div>

          <div className="mt-5 pt-4 border-t border-border/60">
            <button
              type="button"
              className="w-full rounded-md border border-border-strong bg-surface-container-low py-2 text-[11px] font-medium text-on-surface-variant transition-colors hover:border-outline-variant hover:bg-surface-container hover:text-on-surface"
              onClick={() => onChange(emptyBlock())}
            >
              Restaurar vacío
            </button>
          </div>
        </>
      ) : null}
    </article>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  constitution: Constitution;
  onChange: (c: Constitution) => void;
};

const ARRAY_SECTIONS = [
  ["principles", "Principios"],
  ["restrictions", "Restricciones"],
  ["coding", "Estilo de código"],
  ["security", "Seguridad"],
  ["qualityTesting", "Calidad y pruebas"],
  ["collaboration", "Colaboración"],
  ["glossary", "Glosario"],
] as const;

type SectionKey = (typeof ARRAY_SECTIONS)[number][0];

export function ConstitutionDrawer({ open, onClose, constitution, onChange }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  /** Incrementar al eliminar un bloque para remount estable y resetear estado local de colapsado. */
  const [sectionBump, setSectionBump] = useState<Partial<Record<SectionKey, number>>>({});

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

  function bumpSection(key: SectionKey) {
    setSectionBump((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  }

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      className="m-0 ml-auto h-dvh max-h-dvh w-[420px] max-w-[90vw] bg-background border-l border-border text-on-surface shadow-2xl [&::backdrop]:bg-black/50 [&:not([open])]:hidden overflow-hidden flex flex-col p-0"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="h-11 px-4 border-b border-border flex items-center justify-between shrink-0 bg-footer/50">
        <span className="label-xs-uppercase tracking-widest text-on-surface">Constitución</span>
        <button type="button" className="text-outline hover:text-on-surface transition-colors" onClick={onClose}>
          <span className="material-symbols-outlined !text-[18px]">close</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto ws-scrollbar px-4 py-5 space-y-6">
        <div className="markdown-editor-bg rounded-md border border-border/80 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-outline">
            <span className="label-xs-uppercase text-on-surface-variant">Orden canónico</span>
            {" — "}misma secuencia que el Markdown generado: Identidad y Contexto de stack primero; luego
            Principios, Restricciones, Estilo, Seguridad, Calidad, Colaboración y Glosario como secciones{" "}
            <span className="font-mono text-on-surface-variant">##</span> con bloques{" "}
            <span className="font-mono text-on-surface-variant">###</span>. Por defecto los bloques están colapsados; la flecha los expande. En bloques numerados, la
            papelera elimina el bloque.
          </p>
        </div>

        <BlockFields
          variant="pillar"
          sectionHeading="Identidad"
          block={constitution.identity}
          onChange={(b) => onChange({ ...constitution, identity: b })}
        />
        <BlockFields
          variant="pillar"
          sectionHeading="Contexto de stack"
          block={constitution.stackContext}
          onChange={(b) => onChange({ ...constitution, stackContext: b })}
        />

        {ARRAY_SECTIONS.map(([key, label]) => (
          <section key={key} className="space-y-3 pt-3 border-t border-border-strong">
            <header className="pb-2 border-b border-border/60">
              <h3 className="label-xs-uppercase text-outline">{label}</h3>
              <p className="text-[11px] text-outline mt-1.5 leading-snug">
                Sección <span className="font-mono text-on-surface-variant">## {label}</span> — uno o más bloques
                numerados.
              </p>
            </header>
            {(constitution[key] as SectionBlock[]).map((block, idx) => (
              <BlockFields
                key={`${key}-${idx}-${sectionBump[key] ?? 0}`}
                variant="numbered"
                blockNumber={idx + 1}
                block={block}
                onChange={(b) => {
                  const arr = [...(constitution[key] as SectionBlock[])];
                  arr[idx] = b;
                  onChange({ ...constitution, [key]: arr });
                }}
                onRemove={() => {
                  const arr = (constitution[key] as SectionBlock[]).filter((_, i) => i !== idx);
                  onChange({ ...constitution, [key]: arr });
                  bumpSection(key);
                }}
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              className="!h-9 !text-[11px] w-full justify-center border border-dashed border-border-strong hover:border-primary-container/50 hover:bg-footer text-on-surface-variant hover:text-on-surface"
              onClick={() =>
                onChange({ ...constitution, [key]: [...(constitution[key] as SectionBlock[]), emptyBlock()] })
              }
            >
              + Añadir bloque
            </Button>
          </section>
        ))}
      </div>

      <footer className="p-4 border-t border-border bg-input shrink-0">
        <button
          type="button"
          className="w-full py-2.5 bg-transparent border border-border hover:border-primary-container text-on-surface rounded-md text-[11px] font-bold font-[family-name:var(--font-label)] uppercase tracking-widest transition-all"
          onClick={onClose}
        >
          Cerrar
        </button>
      </footer>
    </dialog>
  );
}
