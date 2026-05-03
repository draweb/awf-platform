"use client";

export type EditorTab = {
  id: string;
  title: string;
};

type EditorTabsProps = {
  tabs: EditorTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** `id` del `tabpanel` asociado (p. ej. contenedor del CodeViewer). */
  tabPanelId?: string;
};

/** Nombre de glifo Material Symbols por sufijo / heurística de ruta (16px design, outlined). */
export function tabIconFromTitle(title: string): string {
  const lower = title.toLowerCase();
  const base = lower.includes("/") ? lower.slice(lower.lastIndexOf("/") + 1) : lower;
  const dot = base.lastIndexOf(".");
  const ext = dot >= 0 ? base.slice(dot) : "";

  if (ext === ".json" || ext === ".jsonc") return "data_object";
  if (ext === ".md" || ext === ".mdx" || ext === ".mdc") return "article";
  if (ext === ".yaml" || ext === ".yml") return "assignment";
  if ([".ts", ".tsx", ".mts", ".cts"].includes(ext)) return "code";
  if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext)) return "code";
  if ([".sh", ".bash", ".zsh"].includes(ext)) return "terminal";
  if (ext === ".css" || ext === ".scss") return "css";
  if (ext === ".html" || ext === ".htm") return "html";
  if (ext === ".xml" || ext === ".svg") return "code";
  if (ext === ".py") return "code";
  if (ext === ".sql") return "database";
  if (ext === ".toml") return "tune";
  if (ext === ".dockerfile" || base === "dockerfile") return "terminal";

  if (base.includes("manifest")) return "data_object";
  if (base.includes("changelog")) return "article";
  if (base.includes("meta") && base.endsWith(".yaml")) return "assignment";

  return "draft";
}

/** Caja fija + tamaño de glifo compartidos (archivo y cerrar) para alinear con h-9 y peso visual uniforme. */
const tabIconBox =
  "material-symbols-outlined inline-flex size-6 shrink-0 items-center justify-center p-0 text-[15px] leading-none";

export function EditorTabs({ tabs, activeId, onSelect, onClose, tabPanelId }: EditorTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Archivos abiertos"
      className="explorer-scrollbar flex h-9 shrink-0 items-stretch gap-0 overflow-x-auto border-b border-border bg-background px-1.5"
    >
      {tabs.map((t) => {
        const active = t.id === activeId;
        const tabDomId = `explorer-tab-${t.id}`;
        const icon = tabIconFromTitle(t.title);
        return (
          <div
            key={t.id}
            id={tabDomId}
            role="tab"
            aria-selected={active}
            aria-controls={tabPanelId}
            tabIndex={active ? 0 : -1}
            className={`group flex min-h-0 min-w-0 cursor-pointer items-center gap-2 border-r border-border px-2.5 py-0 transition-colors last:border-r-0 ${
              active
                ? "border-t-2 border-t-primary-container bg-input text-on-surface"
                : "border-t-2 border-t-transparent bg-transparent text-outline hover:bg-footer/80 hover:text-on-surface-variant"
            }`}
            onClick={() => onSelect(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(t.id);
              }
            }}
          >
            <span
              className={`${tabIconBox} select-none ${
                active ? "text-primary" : "text-outline group-hover:text-on-surface-variant"
              }`}
              aria-hidden
            >
              {icon}
            </span>
            <span
              className={`max-w-[min(11rem,40vw)] truncate text-[11px] leading-tight ${
                active ? "font-medium text-on-surface" : "font-normal text-on-surface-variant"
              }`}
            >
              {t.title}
            </span>
            <button
              type="button"
              className={`${tabIconBox} -mr-0.5 rounded-xs text-outline opacity-80 transition-opacity hover:bg-surface-container-low hover:opacity-100 hover:text-on-surface`}
              aria-label={`Cerrar ${t.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.id);
              }}
            >
              close
            </button>
          </div>
        );
      })}
    </div>
  );
}
