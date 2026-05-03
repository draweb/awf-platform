"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CatalogCompositionCard,
  CliInstallActivityCard,
  VersionsLifecycleCard,
} from "./dashboard-metric-cards";

type ActivityFeedLine = {
  id: string;
  kind: "audit" | "install";
  at: string;
  tag: string;
  message: string;
};

type DashboardPayload = {
  artifacts: number;
  versions: number;
  libraries: number;
  versionsPublished: number;
  versionsDraftReview: number;
  versionsDeprecatedYanked: number;
  installEvents24h: number;
  installEvents7d: number;
  distinctInstallUsers7d: number;
  installTrend7d: number[];
  recentWorkspaces: Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
  topArtifactsByInstalls7d: Array<{ artifactName: string; count: number }>;
  activityFeed: ActivityFeedLine[];
};

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function formatFeedTime(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(11, 19);
}

const workspaceStatusStyles: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  active: { dot: "bg-green-500 animate-pulse", text: "text-green-500", label: "ACTIVE" },
  draft: { dot: "bg-yellow-500", text: "text-yellow-500", label: "DRAFT" },
  archived: { dot: "bg-outline", text: "text-outline", label: "ARCHIVED" },
};

function feedLineColor(kind: ActivityFeedLine["kind"], tag: string): string {
  if (kind === "install") return "text-secondary";
  if (/ERR|FAIL|INVALID/i.test(tag)) return "text-red-500";
  if (/WARN|DEPREC/i.test(tag)) return "text-yellow-500";
  if (/PUBLISH|CREATE|POST/i.test(tag)) return "text-green-500";
  return "text-primary-container";
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [wsFilter, setWsFilter] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/v1/admin/dashboard", { credentials: "include" });
      const j = (await res.json()) as { error?: { message?: string } } & Partial<DashboardPayload>;
      if (!res.ok) {
        setErr(j.error?.message ?? "No se pudo cargar el dashboard");
        setData(null);
        return;
      }
      setErr(null);
      setData({
        artifacts: j.artifacts ?? 0,
        versions: j.versions ?? 0,
        libraries: j.libraries ?? 0,
        versionsPublished: j.versionsPublished ?? 0,
        versionsDraftReview: j.versionsDraftReview ?? 0,
        versionsDeprecatedYanked: j.versionsDeprecatedYanked ?? 0,
        installEvents24h: j.installEvents24h ?? 0,
        installEvents7d: j.installEvents7d ?? 0,
        distinctInstallUsers7d: j.distinctInstallUsers7d ?? 0,
        installTrend7d: j.installTrend7d ?? [0, 0, 0, 0, 0, 0, 0],
        recentWorkspaces: j.recentWorkspaces ?? [],
        topArtifactsByInstalls7d: j.topArtifactsByInstalls7d ?? [],
        activityFeed: j.activityFeed ?? [],
      });
    })();
  }, []);

  const filteredWorkspaces = useMemo(() => {
    if (!data) return [];
    const q = wsFilter.trim().toLowerCase();
    if (!q) return data.recentWorkspaces;
    return data.recentWorkspaces.filter(
      (w) =>
        w.slug.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q),
    );
  }, [data, wsFilter]);

  return (
    <div className="h-full grid grid-cols-12 auto-rows-auto gap-3">
      <CatalogCompositionCard
        artifacts={data?.artifacts ?? 0}
        libraries={data?.libraries ?? 0}
        loading={!data && !err}
        error={!!err}
      />
      <VersionsLifecycleCard
        versions={data?.versions ?? 0}
        published={data?.versionsPublished ?? 0}
        draftReview={data?.versionsDraftReview ?? 0}
        deprecatedYanked={data?.versionsDeprecatedYanked ?? 0}
        artifacts={data?.artifacts ?? 0}
        loading={!data && !err}
        error={!!err}
      />
      <CliInstallActivityCard
        installEvents24h={data?.installEvents24h ?? 0}
        installEvents7d={data?.installEvents7d ?? 0}
        distinctInstallUsers7d={data?.distinctInstallUsers7d ?? 0}
        installTrend7d={data?.installTrend7d ?? [0, 0, 0, 0, 0, 0, 0]}
        loading={!data && !err}
        error={!!err}
      />

      <div className="col-span-12 md:col-span-8 bg-footer border border-border flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-border flex justify-between items-center shrink-0 gap-2">
          <span className="font-[family-name:var(--font-label)] text-xs uppercase text-on-surface">
            Workspaces recientes
          </span>
          <div className="flex gap-2 items-center min-w-0">
            <label className="sr-only" htmlFor="ws-filter">
              Filtrar workspaces
            </label>
            <input
              id="ws-filter"
              type="search"
              placeholder="Filtrar…"
              value={wsFilter}
              onChange={(e) => setWsFilter(e.target.value)}
              className="max-w-[200px] rounded-xs border border-border bg-background px-2 py-1 text-xs text-on-surface placeholder:text-outline"
            />
            <Link
              href="/admin/workspaces"
              className="shrink-0 p-1 hover:bg-surface-container-low rounded-xs text-outline hover:text-on-surface"
              aria-label="Ir a workspaces"
            >
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </Link>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-footer border-b border-border">
              <tr>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] uppercase text-outline text-[10px]">
                  Workspace
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] uppercase text-outline text-[10px]">
                  Estado
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] uppercase text-outline text-[10px]">
                  Actualizado
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] uppercase text-outline text-[10px] text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!data && !err ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-outline text-center">
                    Cargando…
                  </td>
                </tr>
              ) : filteredWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-outline text-center">
                    {data?.recentWorkspaces.length === 0
                      ? "No hay workspaces. Creá uno en Workspaces."
                      : "Ningún resultado para el filtro."}
                  </td>
                </tr>
              ) : (
                filteredWorkspaces.map((ws) => {
                  const st = workspaceStatusStyles[ws.status] ?? workspaceStatusStyles.draft;
                  return (
                    <tr key={ws.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-on-surface font-medium truncate">{ws.name}</span>
                          <span className="font-mono text-xs text-outline truncate">{ws.slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                          <span
                            className={`text-[11px] font-bold uppercase tracking-widest ${st.text}`}
                          >
                            {st.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-on-surface-variant whitespace-nowrap">
                        {formatRelativeTime(ws.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/workspaces/${ws.id}/edit`}
                          className="inline-flex text-outline hover:text-on-surface transition-colors"
                          aria-label={`Editar ${ws.name}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4 bg-footer border border-border relative overflow-hidden flex flex-col min-h-[250px]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent pointer-events-none" />
        <div className="relative z-[1] px-4 py-2 border-b border-border flex justify-between items-center shrink-0">
          <span className="font-[family-name:var(--font-label)] text-xs uppercase text-on-surface">
            Top instalaciones CLI (7 días)
          </span>
          <Link
            href="/admin/artifacts"
            className="text-[10px] font-mono text-outline hover:text-on-surface uppercase"
          >
            Paquetes
          </Link>
        </div>
        <div className="relative z-[1] flex-1 overflow-y-auto p-3 space-y-2">
          {!data && !err ? (
            <p className="text-xs text-outline">Cargando…</p>
          ) : (data?.topArtifactsByInstalls7d.length ?? 0) === 0 ? (
            <p className="text-xs text-outline">
              Sin instalaciones en los últimos 7 días. El CLI registra eventos al completar{" "}
              <code className="text-on-surface-variant">awf install</code>.
            </p>
          ) : (
            data!.topArtifactsByInstalls7d.map((row) => (
              <Link
                key={row.artifactName}
                href={`/admin/artifacts/${encodeURIComponent(row.artifactName)}`}
                className="flex items-center justify-between gap-2 rounded-xs border border-border bg-background/80 px-3 py-2 hover:bg-surface-container-low transition-colors"
              >
                <span className="font-mono text-[11px] text-on-surface truncate">{row.artifactName}</span>
                <span className="shrink-0 text-xs font-bold text-primary-container">{row.count}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="col-span-12 bg-input border border-border rounded-t-lg overflow-hidden flex flex-col max-h-[320px]">
        <div className="bg-surface-container-low h-8 flex items-center px-4 justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-xs text-outline shrink-0">history</span>
            <span className="font-mono text-[11px] text-on-surface-variant truncate">
              Actividad reciente (audit + instalaciones CLI)
            </span>
          </div>
          <Link
            href="/admin/settings"
            className="text-[10px] text-outline hover:text-on-surface uppercase shrink-0"
          >
            Panel
          </Link>
        </div>
        <div className="flex-1 min-h-0 p-3 font-mono text-xs leading-relaxed overflow-y-auto text-outline">
          {!data && !err ? (
            <span>Cargando…</span>
          ) : (data?.activityFeed.length ?? 0) === 0 ? (
            <span>Sin eventos recientes.</span>
          ) : (
            data!.activityFeed.map((e) => (
              <div key={e.id} className="flex gap-3">
                <span className="text-outline-variant/40 shrink-0 w-[64px]">{formatFeedTime(e.at)}</span>
                <span className={`shrink-0 w-[88px] truncate ${feedLineColor(e.kind, e.tag)}`}>
                  [{e.tag}]
                </span>
                <span className="text-on-surface-variant break-words">{e.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {err && (
        <div className="col-span-12 bg-error-container/20 border border-error/30 p-3 rounded-xs text-sm text-error">
          {err}
        </div>
      )}
    </div>
  );
}
