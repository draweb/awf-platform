"use client";

type Props = {
  activeTab: "editor" | "preview";
  onTabChange: (tab: "editor" | "preview") => void;
  onSave: () => void;
  saving: boolean;
  onInsert?: (prefix: string, suffix?: string) => void;
};

export function EditorHeader({ activeTab, onTabChange, onSave, saving, onInsert }: Props) {
  const toolbarButtons = [
    { icon: "format_bold", prefix: "**", suffix: "**" },
    { icon: "format_italic", prefix: "_", suffix: "_" },
    { icon: "link", prefix: "[", suffix: "](url)" },
    { icon: "image", prefix: "![alt](", suffix: ")" },
    { icon: "code", prefix: "`", suffix: "`" },
  ];

  return (
    <div className="h-9 border-b border-border flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-6">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "editor"}
          className={`flex items-center gap-2 h-9 px-1 text-[11px] font-medium transition-colors ${
            activeTab === "editor"
              ? "text-on-surface border-b-2 border-primary-container"
              : "text-outline hover:text-on-surface"
          }`}
          onClick={() => onTabChange("editor")}
        >
          <span className="material-symbols-outlined !text-[14px]">edit</span>
          Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "preview"}
          className={`flex items-center gap-2 h-9 px-1 text-[11px] font-medium transition-colors ${
            activeTab === "preview"
              ? "text-on-surface border-b-2 border-primary-container"
              : "text-outline hover:text-on-surface"
          }`}
          onClick={() => onTabChange("preview")}
        >
          <span className="material-symbols-outlined !text-[14px]">visibility</span>
          Preview
        </button>
      </div>

      <div className="flex items-center gap-4">
        {activeTab === "editor" && (
          <div className="flex items-center gap-1">
            {toolbarButtons.map((btn) => (
              <button
                key={btn.icon}
                type="button"
                className="p-1 hover:bg-footer rounded text-outline hover:text-on-surface transition-colors"
                onClick={() => onInsert?.(btn.prefix, btn.suffix)}
              >
                <span className="material-symbols-outlined !text-[16px]">{btn.icon}</span>
              </button>
            ))}
          </div>
        )}
        <div className="h-4 w-px bg-border" />
        <button
          type="button"
          disabled={saving}
          className="flex items-center gap-1.5 text-[10px] font-bold font-[family-name:var(--font-label)] text-primary hover:text-primary-fixed uppercase tracking-wider disabled:opacity-50"
          onClick={onSave}
        >
          <span className="material-symbols-outlined !text-[14px]">send</span>
          <span>{saving ? "Guardando…" : "Guardar"}</span>
        </button>
      </div>
    </div>
  );
}
