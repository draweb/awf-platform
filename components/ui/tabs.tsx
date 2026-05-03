"use client";

import { useId, useState, type ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
};

export function Tabs({ tabs, defaultTabId, className = "" }: TabsProps) {
  const baseId = useId();
  const firstId = tabs[0]?.id ?? "";
  const [active, setActive] = useState(defaultTabId ?? firstId);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  if (!activeTab) {
    return null;
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label="Secciones" className="flex flex-wrap gap-1 border-b border-border pb-px">
        {tabs.map((t) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              aria-controls={`${baseId}-panel-${t.id}`}
              className={`px-3 py-2 text-[11px] font-medium rounded-t-xs border border-transparent -mb-px transition-colors ${
                selected
                  ? "bg-surface-container-low text-on-surface border-border border-b-surface-container-low"
                  : "text-outline hover:text-on-surface hover:bg-footer"
              }`}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const i = tabs.findIndex((x) => x.id === active);
                  const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
                  setActive(tabs[next]!.id);
                }
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.id}`}
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        className="pt-4 min-h-[240px]"
      >
        {activeTab.content}
      </div>
    </div>
  );
}
