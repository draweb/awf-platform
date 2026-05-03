"use client";

type Props = {
  status: "draft" | "active" | "archived";
  slug: string;
  charCount: number;
  autosaveState: "idle" | "saving" | "saved" | "error";
};

const statusColor: Record<string, string> = {
  draft: "bg-outline",
  active: "bg-emerald-500",
  archived: "bg-error-container",
};

const autosaveLabel: Record<string, string> = {
  idle: "",
  saving: "SYNCING",
  saved: "SYNCED",
  error: "SYNC ERROR",
};

export function WorkspaceStatusBar({ status, slug, charCount, autosaveState }: Props) {
  return (
    <footer
      role="status"
      aria-live="polite"
      className="h-6 border-t border-border bg-background flex items-center px-4 justify-between shrink-0"
    >
      <div className="flex items-center gap-4 text-[9px] font-mono">
        <div className="flex items-center gap-1">
          <span className={`dot-status ${statusColor[status]}`} />
          <span className="text-on-surface uppercase">{status}</span>
        </div>
        <div className="flex items-center gap-1 text-outline">
          <span className="material-symbols-outlined !text-[12px]">account_tree</span>
          <span>{slug || "—"}</span>
        </div>
        {autosaveState !== "idle" && (
          <div className={`flex items-center gap-1 ${autosaveState === "error" ? "text-error" : "text-outline"}`}>
            <span className="material-symbols-outlined !text-[12px]">sync</span>
            <span>{autosaveLabel[autosaveState]}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-[9px] text-outline font-mono">
        <span>UTF-8</span>
        <span>Markdown</span>
        <span className="text-primary">chars: {charCount}</span>
      </div>
    </footer>
  );
}
