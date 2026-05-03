"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/components/ui/alert-provider";

type Stats = {
  artifacts: number;
  versions: number;
  installEvents24h: number;
};

type InstallRow = {
  id: string;
  createdAt: string;
  version: string;
  cliVersion: string;
  artifact: { name: string };
};

type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
};

export default function SettingsApiPage() {
  const { showError } = useAlert();
  const [stats, setStats] = useState<Stats | null>(null);
  const [installs, setInstalls] = useState<InstallRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setForbidden(false);
    const [rStats, rInstall, rAudit] = await Promise.all([
      fetch("/api/v1/admin/stats", { credentials: "include" }),
      fetch("/api/v1/admin/install-events?limit=8", { credentials: "include" }),
      fetch("/api/v1/admin/audit-logs?limit=8", { credentials: "include" }),
    ]);

    if (rStats.status === 403 || rInstall.status === 403 || rAudit.status === 403) {
      setForbidden(true);
      setStats(null);
      setInstalls([]);
      setAudits([]);
      return;
    }

    if (!rStats.ok || !rInstall.ok || !rAudit.ok) {
      showError("No se pudieron cargar las métricas de administración.");
      setStats(null);
      setInstalls([]);
      setAudits([]);
      return;
    }

    const jStats = (await rStats.json()) as { artifacts?: number; versions?: number; installEvents24h?: number };
    const jInstall = (await rInstall.json()) as { items?: InstallRow[] };
    const jAudit = (await rAudit.json()) as { items?: AuditRow[] };

    setStats({
      artifacts: jStats.artifacts ?? 0,
      versions: jStats.versions ?? 0,
      installEvents24h: jStats.installEvents24h ?? 0,
    });
    setInstalls(jInstall.items ?? []);
    setAudits(jAudit.items ?? []);
  }, [showError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  function formatShort(iso: string): string {
    try {
      return new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-0 pb-10">
        <header className="awf-fade-up space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1 text-xs font-medium text-outline transition-colors hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Configuración
            </Link>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">API y uso</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-outline">
            Métricas agregadas del registry e instalaciones reportadas por el CLI. No incluye tráfico HTTP por ruta;
            para contratos y pruebas interactivas usá la documentación OpenAPI.
          </p>
        </header>

        <div className="awf-fade-up flex flex-wrap gap-2">
          <Link
            href="/admin/api-docs"
            className="inline-flex items-center gap-2 rounded-sm border border-primary-container/50 bg-primary-container/15 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-container/25"
          >
            <span className="material-symbols-outlined text-[20px]">hub</span>
            Abrir API docs (OpenAPI)
          </Link>
          <Link
            href="/admin/help/api-reference"
            className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            Ayuda · Referencia API
          </Link>
        </div>

        {forbidden ? (
          <div className="rounded-sm border border-border bg-footer px-4 py-3 text-sm text-outline">
            Necesitás rol mantenedor o superior (o PAT con scope <code className="text-on-surface-variant">admin:read</code>)
            para ver estadísticas y listados administrativos.
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-outline">Cargando métricas…</p>
        ) : !forbidden && stats ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Artefactos", value: stats.artifacts, icon: "package_2" },
                { label: "Versiones publicadas", value: stats.versions, icon: "layers" },
                { label: "Instalaciones CLI (24 h)", value: stats.installEvents24h, icon: "download" },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-sm border border-border bg-footer p-4 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-[20px]">{k.icon}</span>
                    <span className="text-xs font-medium uppercase tracking-wide">{k.label}</span>
                  </div>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-on-surface">{k.value}</p>
                </div>
              ))}
            </div>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-on-surface">Últimas instalaciones (CLI)</h2>
              <div className="overflow-x-auto rounded-sm border border-border">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="border-b border-border bg-surface-container-low text-outline">
                    <tr>
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium">Artefacto</th>
                      <th className="px-3 py-2 font-medium">Versión</th>
                      <th className="px-3 py-2 font-medium">CLI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-footer">
                    {installs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-outline">
                          Sin eventos recientes.
                        </td>
                      </tr>
                    ) : (
                      installs.map((row) => (
                        <tr key={row.id} className="text-on-surface-variant">
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-outline">
                            {formatShort(row.createdAt)}
                          </td>
                          <td className="px-3 py-2 text-on-surface">{row.artifact?.name ?? "—"}</td>
                          <td className="px-3 py-2">{row.version}</td>
                          <td className="px-3 py-2">{row.cliVersion}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-on-surface">Actividad reciente (auditoría)</h2>
              <p className="text-xs text-outline">
                Muestras de acciones registradas en el servidor; no equivale a volumen por endpoint HTTP.
              </p>
              <div className="overflow-x-auto rounded-sm border border-border">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead className="border-b border-border bg-surface-container-low text-outline">
                    <tr>
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium">Acción</th>
                      <th className="px-3 py-2 font-medium">Entidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-footer">
                    {audits.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-outline">
                          Sin entradas recientes.
                        </td>
                      </tr>
                    ) : (
                      audits.map((row) => (
                        <tr key={row.id} className="text-on-surface-variant">
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-outline">
                            {formatShort(row.createdAt)}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-on-surface">{row.action}</td>
                          <td className="px-3 py-2">
                            {row.entityType}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : !forbidden ? (
          <p className="text-sm text-outline">No hay datos para mostrar.</p>
        ) : null}
      </div>
    </div>
  );
}
