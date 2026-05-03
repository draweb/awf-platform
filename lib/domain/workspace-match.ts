/**
 * Scoring heurístico proyecto ↔ workspace de catálogo (stacks declarados).
 * Usado por POST /api/v1/workspaces/match.
 */

export type WorkspaceStacksRow = {
  id: string;
  slug: string;
  name: string;
  stacks: string[];
  status: "draft" | "active" | "archived";
};

export type MatchResult = {
  workspaceId: string;
  slug: string;
  name: string;
  score: number;
  reasons: string[];
};

function normStacks(stacks: string[]): Set<string> {
  return new Set(stacks.map((s) => s.trim().toLowerCase()).filter(Boolean));
}

/** Mayor puntaje = mejor coincidencia. */
export function scoreWorkspaceAgainstStacks(
  queryStacks: string[],
  row: WorkspaceStacksRow,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const q = normStacks(queryStacks);
  const w = normStacks(row.stacks);
  let overlap = 0;
  for (const s of q) {
    if (w.has(s)) {
      overlap += 1;
      reasons.push(`stack compartido: ${s}`);
    }
  }
  const base = q.size === 0 ? 0 : Math.round((overlap / q.size) * 100);
  let bonus = 0;
  if (row.status === "active") {
    bonus += 15;
    reasons.push("estado active");
  } else if (row.status === "draft") {
    bonus += 5;
    reasons.push("estado draft");
  }
  const score = Math.min(100, base + bonus);
  if (overlap === 0 && q.size > 0) {
    reasons.push("sin intersección de stacks con la consulta");
  }
  return { score, reasons };
}

export function rankWorkspacesByStacks(
  queryStacks: string[],
  rows: WorkspaceStacksRow[],
  limit = 20,
): MatchResult[] {
  const scored = rows.map((row) => {
    const { score, reasons } = scoreWorkspaceAgainstStacks(queryStacks, row);
    return {
      workspaceId: row.id,
      slug: row.slug,
      name: row.name,
      score,
      reasons,
    };
  });
  scored.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  return scored.slice(0, limit);
}
