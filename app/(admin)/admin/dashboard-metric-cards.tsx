"use client";

/**
 * Tarjetas métricas del dashboard: composición (part-to-whole), estados categóricos,
 * serie temporal (histograma 7d). Colores alineados a tokens existentes (primary / tertiary / secondary).
 */

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((100 * part) / total);
}

/** Últimos 7 días calendario UTC, del más antiguo al más reciente (mismo orden que `installTrend7d`). */
export function utcLast7DayLabels(now: Date): string[] {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const out: string[] = [];
  const d = new Date(start);
  for (let i = 0; i < 7; i++) {
    out.push(
      d.toLocaleDateString("es", {
        timeZone: "UTC",
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    );
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

type CatalogCardProps = {
  artifacts: number;
  libraries: number;
  loading: boolean;
  error: boolean;
};

/** Composición del catálogo: paquetes vs bibliotecas (part-to-whole → barra apilada 100%). */
export function CatalogCompositionCard({ artifacts, libraries, loading, error }: CatalogCardProps) {
  const total = Math.max(artifacts + libraries, 1);
  const artW = pct(artifacts, total);
  const libW = pct(libraries, total);
  return (
    <article className="col-span-12 md:col-span-4 rounded-lg border border-border bg-gradient-to-br from-footer to-surface-container-lowest p-4 shadow-sm ring-1 ring-white/[0.04] flex flex-col justify-between min-h-[148px]">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.14em] text-outline">
            Catálogo
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">Composición registry</p>
          <h3 className="text-2xl font-semibold tabular-nums text-on-surface mt-1">
            {error ? "—" : loading ? "…" : artifacts + libraries}
          </h3>
          <p className="text-[10px] font-mono text-outline mt-0.5">artefactos + bibliotecas</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary-container/25 bg-primary-container/15 shadow-inner">
          <span className="material-symbols-outlined text-[26px] text-primary-container">inventory_2</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-border ring-1 ring-inset ring-black/20"
          role="img"
          aria-label={`Paquetes ${artifacts}, bibliotecas ${libraries}`}
        >
          {artifacts > 0 && (
            <span
              style={{ width: `${artW}%` }}
              className="min-w-[4px] bg-gradient-to-b from-primary-container to-primary-container/85 transition-[width] duration-300"
              title={`Paquetes (artefactos): ${artifacts} (${artW}%)`}
            />
          )}
          {libraries > 0 && (
            <span
              style={{ width: `${libW}%` }}
              className="min-w-[4px] bg-gradient-to-b from-outline/50 to-outline/35 transition-[width] duration-300"
              title={`Bibliotecas curadas: ${libraries} (${libW}%)`}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-outline">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-container" aria-hidden />
            Paquetes <strong className="text-on-surface tabular-nums">{loading ? "…" : artifacts}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-outline/60" aria-hidden />
            Bibliotecas <strong className="text-on-surface tabular-nums">{loading ? "…" : libraries}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}

type VersionsCardProps = {
  versions: number;
  published: number;
  draftReview: number;
  deprecatedYanked: number;
  artifacts: number;
  loading: boolean;
  error: boolean;
};

/** Estados de versiones: part-to-whole categórico (publicadas · en curso · retiradas). */
export function VersionsLifecycleCard({
  versions,
  published,
  draftReview,
  deprecatedYanked,
  artifacts,
  loading,
  error,
}: VersionsCardProps) {
  const total = Math.max(versions, 1);
  const pPct = pct(published, total);
  const dPct = pct(draftReview, total);
  const rPct = pct(deprecatedYanked, total);
  const avgPerPkg = artifacts > 0 && versions > 0 ? (versions / artifacts).toFixed(1) : "—";

  return (
    <article className="col-span-12 md:col-span-4 rounded-lg border border-border bg-gradient-to-br from-footer to-surface-container-lowest p-4 shadow-sm ring-1 ring-white/[0.04] flex flex-col justify-between min-h-[148px]">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.14em] text-outline">
            Versiones
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">Estado en el registry</p>
          <h3 className="text-2xl font-semibold tabular-nums text-on-surface mt-1">
            {error ? "—" : loading ? "…" : versions}
          </h3>
          <p className="text-[10px] font-mono text-outline mt-0.5">
            ~{loading ? "…" : avgPerPkg} ver. / paquete
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-tertiary/30 bg-tertiary/15 shadow-inner">
          <span className="material-symbols-outlined text-[26px] text-tertiary">layers</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-border ring-1 ring-inset ring-black/20"
          role="img"
          aria-label={`Publicadas ${published}, borrador o revisión ${draftReview}, retiradas ${deprecatedYanked}`}
        >
          {published > 0 && (
            <span
              style={{ width: `${pPct}%` }}
              className="min-w-[4px] bg-gradient-to-b from-tertiary to-tertiary/75"
              title={`Publicadas: ${published} (${pPct}%)`}
            />
          )}
          {draftReview > 0 && (
            <span
              style={{ width: `${dPct}%` }}
              className="min-w-[4px] bg-gradient-to-b from-amber-500/90 to-amber-600/70"
              title={`Borrador / revisión: ${draftReview} (${dPct}%)`}
            />
          )}
          {deprecatedYanked > 0 && (
            <span
              style={{ width: `${rPct}%` }}
              className="min-w-[4px] bg-gradient-to-b from-outline to-outline/70"
              title={`Deprecated / yanked: ${deprecatedYanked} (${rPct}%)`}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-outline">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-tertiary" />
            Pub. <strong className="text-on-surface tabular-nums">{loading ? "…" : published}</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Draft/rev.{" "}
            <strong className="text-on-surface tabular-nums">{loading ? "…" : draftReview}</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-outline" />
            Retiradas{" "}
            <strong className="text-on-surface tabular-nums">{loading ? "…" : deprecatedYanked}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}

type CliCardProps = {
  installEvents24h: number;
  installEvents7d: number;
  distinctInstallUsers7d: number;
  installTrend7d: number[];
  loading: boolean;
  error: boolean;
};

/** Serie temporal: histograma 7 días UTC + contexto 24h vs media semanal. */
export function CliInstallActivityCard({
  installEvents24h,
  installEvents7d,
  distinctInstallUsers7d,
  installTrend7d,
  loading,
  error,
}: CliCardProps) {
  const now = new Date();
  const dayLabels = utcLast7DayLabels(now);
  const counts = installTrend7d.length === 7 ? installTrend7d : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...counts);
  const avgDaily = installEvents7d / 7;
  const vsDailyMult = avgDaily > 0 ? installEvents24h / avgDaily : installEvents24h > 0 ? Infinity : 0;
  const barAreaPx = 52;

  return (
    <article className="col-span-12 md:col-span-4 rounded-lg border border-border bg-gradient-to-br from-footer to-surface-container-lowest p-4 shadow-sm ring-1 ring-white/[0.04] flex flex-col justify-between min-h-[148px]">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.14em] text-outline">
            Instalaciones CLI
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">Últimas 24 h vs semana (UTC)</p>
          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <h3 className="text-2xl font-semibold tabular-nums text-on-surface">
              {error ? "—" : loading ? "…" : installEvents24h}
            </h3>
            {!loading && !error && avgDaily > 0 && Number.isFinite(vsDailyMult) && (
              <span
                className={`text-[11px] font-mono font-medium tabular-nums ${
                  vsDailyMult >= 1 ? "text-emerald-400/90" : "text-amber-500/90"
                }`}
                title={`Media diaria (7 días): ${avgDaily.toFixed(1)} instalaciones/día UTC`}
              >
                ×{vsDailyMult.toFixed(1)} vs media día
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-outline mt-0.5">
            7 días: <strong className="text-on-surface-variant">{loading ? "…" : installEvents7d}</strong>
            {" · "}
            <strong className="text-on-surface-variant">{loading ? "…" : distinctInstallUsers7d}</strong>{" "}
            usuarios
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-secondary/35 bg-secondary/12 shadow-inner">
          <span className="material-symbols-outlined text-[26px] text-secondary">terminal</span>
        </div>
      </div>

      <div className="mt-3">
        <p className="font-mono text-[9px] uppercase tracking-wider text-outline mb-1.5">
          Histograma por día (UTC)
        </p>
        <div
          className="flex items-end justify-between gap-1"
          style={{ height: barAreaPx }}
          role="img"
          aria-label="Instalaciones por día últimos 7 días UTC"
        >
          {counts.map((n, i) => {
            const hPx = max > 0 ? Math.max(4, Math.round((n / max) * (barAreaPx - 14))) : 3;
            return (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span
                  className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-secondary via-secondary to-secondary/75 shadow-sm ring-1 ring-secondary/20 transition-all hover:ring-secondary/50"
                  style={{ height: loading ? 8 : hPx }}
                  title={`${n} instalaciones · ${dayLabels[i] ?? ""}`}
                />
                <span
                  className="max-w-full truncate text-center font-mono text-[8px] leading-none text-outline"
                  title={dayLabels[i]}
                >
                  {dayLabels[i]?.replace(/\.$/, "") ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
