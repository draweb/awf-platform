"use client";

type FileTreeItemProps = {
  depth: number;
  icon: "folder" | "folder_open" | "description" | "code" | "article" | "data_object" | "terminal" | "css";
  label: string;
  expanded?: boolean;
  expandable?: boolean;
  active?: boolean;
  /** Resaltado por navegación con teclado (estilo paleta). */
  keyboardFocused?: boolean;
  deprecated?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
};

export function FileTreeItem({
  depth,
  icon,
  label,
  expanded,
  expandable,
  active,
  keyboardFocused,
  deprecated,
  onToggle,
  onClick,
}: FileTreeItemProps) {
  const paddingLeft = 12 + depth * 12;
  const kbdRing = keyboardFocused ? "ring-1 ring-inset ring-primary-container/50 bg-surface-container-low/60" : "";

  if (expandable) {
    return (
      <button
        type="button"
        className={`group flex items-center w-full py-1 pr-2 text-left transition-colors duration-150 rounded-xs ${
          active ? "bg-surface-container-low" : "hover:bg-footer"
        } ${kbdRing} ${deprecated ? "opacity-60" : ""}`}
        style={{ paddingLeft }}
        onClick={onToggle}
        title={label}
      >
        <span className="material-symbols-outlined text-outline mr-1 text-base shrink-0 w-4 flex justify-center">
          {expanded ? "expand_more" : "chevron_right"}
        </span>
        <span className={`material-symbols-outlined mr-2 text-lg shrink-0 ${expanded ? "text-primary-container" : "text-outline"}`}>
          {expanded ? "folder_open" : "folder"}
        </span>
        <span className="text-xs text-on-surface-variant truncate">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`flex items-center w-full py-1 pr-2 text-left transition-colors duration-150 border-l-2 ${
        active ? "bg-surface-container-low border-primary-container text-primary" : "border-transparent hover:bg-footer text-outline"
      }`}
      style={{ paddingLeft: paddingLeft + 20 }}
      onClick={onClick}
      title={label}
    >
      <span className={`material-symbols-outlined mr-2 text-lg shrink-0 ${active ? "text-primary" : "text-outline"}`}>{icon}</span>
      <span className={`text-xs truncate ${active ? "text-primary" : "text-on-surface-variant"}`}>{label}</span>
    </button>
  );
}
