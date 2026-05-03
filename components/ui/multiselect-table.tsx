"use client";

import type { ReactNode } from "react";

export type MultiselectColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type MultiselectTableProps<T extends { id: string }> = {
  rows: T[];
  columns: MultiselectColumn<T>[];
  selectedIds: Set<string>;
  onToggle: (id: string, selected: boolean) => void;
  emptyMessage?: string;
};

export function MultiselectTable<T extends { id: string }>({
  rows,
  columns,
  selectedIds,
  onToggle,
  emptyMessage = "Sin filas",
}: MultiselectTableProps<T>) {
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-surface-container-low border-b border-border">
          <tr>
            <th className="w-10 px-2 py-2 font-medium text-outline uppercase tracking-wide" scope="col">
              Sel.
            </th>
            {columns.map((c) => (
              <th key={c.id} scope="col" className={`px-2 py-2 font-medium text-outline uppercase tracking-wide ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-outline">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const checked = selectedIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    checked
                      ? "bg-primary-container/10 hover:bg-primary-container/15"
                      : "hover:bg-footer/50"
                  }`}
                >
                  <td className="px-2 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`Seleccionar fila ${row.id}`}
                      onChange={(e) => onToggle(row.id, e.target.checked)}
                      className="accent-primary-container"
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className={`px-2 py-2 align-middle text-on-surface ${c.className ?? ""}`}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
