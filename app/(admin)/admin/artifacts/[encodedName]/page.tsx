"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type VersionRow = {
  id: string;
  version: string;
  status: string;
  checksumSha256: string;
  createdAt: string;
};

type ArtifactDetail = {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  visibility?: string;
  owner?: string;
  ownerEmail?: string | null;
  updatedAt?: string;
  versions: VersionRow[];
  distTags: { tag: string; version: string }[];
  installEvents24h?: number;
  installEvents7d?: number;
};

function relativeTimeEs(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (sec < 60) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const h = Math.round(min / 60);
  if (h < 48) return rtf.format(-h, "hour");
  const d = Math.round(h / 24);
  return rtf.format(-d, "day");
}

function shortChecksum(hex: string): string {
  if (hex.length <= 14) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-4)}`;
}

const artifactStatusChip: Record<string, { dot: string; text: string; label: string }> = {
  active: { dot: "bg-emerald-500", text: "text-emerald-400", label: "ACTIVE" },
  deprecated: { dot: "bg-amber-500", text: "text-amber-400", label: "DEPRECATED" },
  archived: { dot: "bg-outline", text: "text-outline", label: "ARCHIVED" },
};

const versionStatusChip: Record<string, { dot: string; text: string; label: string }> = {
  published: { dot: "bg-emerald-500", text: "text-emerald-400", label: "PUBLISHED" },
  draft: { dot: "bg-amber-500", text: "text-amber-400", label: "DRAFT" },
  review: { dot: "bg-sky-400", text: "text-sky-300", label: "REVIEW" },
  deprecated: { dot: "bg-outline", text: "text-outline", label: "DEPRECATED" },
  yanked: { dot: "bg-red-500", text: "text-red-400", label: "YANKED" },
};

export default function ArtifactDetailPage() {
  const params = useParams();
  const encodedName = params.encodedName as string;
  const [data, setData] = useState<ArtifactDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copiedShaFor, setCopiedShaFor] = useState<string | null>(null);

  const pathSeg = useMemo(() => encodeURIComponent(decodeURIComponent(encodedName)), [encodedName]);

  const copySha = useCallback(async (versionId: string, full: string) => {
    try {
      await navigator.clipboard.writeText(full);
      setCopiedShaFor(versionId);
      window.setTimeout(() => setCopiedShaFor((c) => (c === versionId ? null : c)), 2000);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setErr(null);
      const res = await fetch(`/api/v1/artifacts/${pathSeg}`, {
        credentials: "include",
      });
      const j = (await res.json()) as ArtifactDetail & { error?: { message?: string } };
      if (!res.ok) {
        setErr(j.error?.message ?? "Error");
        setData(null);
        return;
      }
      setData(j as ArtifactDetail);
    })();
  }, [pathSeg]);

  if (err) {
    return (
      <div className="rounded-lg border border-error/30 bg-error-container/15 px-4 py-4 text-sm text-error">
        <p>{err}</p>
        <Link
          href="/admin/artifacts"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a paquetes
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-footer px-4 py-12 text-center">
        <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-outline">
          Cargando paquete…
        </p>
      </div>
    );
  }

  const ast = artifactStatusChip[data.status] ?? artifactStatusChip.active;

  return (
    <div className="flex flex-col gap-3 min-h-0 pb-4">
      <Link
        href="/admin/artifacts"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-outline transition-colors hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[20px] leading-none">arrow_back</span>
        Paquetes
      </Link>

      {/* Hero */}
      <section className="rounded-lg border border-border bg-gradient-to-br from-footer to-surface-container-lowest p-4 shadow-sm ring-1 ring-white/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.14em] text-outline">
              Registry
            </p>
            <h1 className="mt-1 break-all text-xl font-semibold leading-tight text-on-surface md:text-2xl">
              {data.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{data.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-widest ${ast.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${ast.dot}`} aria-hidden />
              {ast.label}
            </span>
            <span className="rounded-full border border-border bg-surface-container-low px-2.5 py-1 font-mono text-[11px] text-on-surface-variant">
              {data.type}
            </span>
            {data.visibility && (
              <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-outline">
                {data.visibility}
              </span>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 border-t border-border pt-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
              Visibilidad
            </dt>
            <dd className="mt-1 font-mono text-sm text-on-surface">{data.visibility ?? "—"}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <dt className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
              Owner
            </dt>
            <dd
              className="mt-1 truncate font-mono text-sm text-on-surface-variant"
              title={data.ownerEmail ?? data.owner ?? undefined}
            >
              {data.ownerEmail ?? data.owner ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
              Versiones
            </dt>
            <dd className="mt-1 tabular-nums font-mono text-sm text-on-surface">{data.versions.length}</dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
              Actualizado
            </dt>
            <dd className="mt-1 font-mono text-sm text-on-surface-variant">
              {data.updatedAt ? relativeTimeEs(data.updatedAt) : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-4">
          <div>
            <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
              Instalaciones CLI (24h)
            </p>
            <p className="mt-1 tabular-nums font-mono text-sm text-on-surface">
              {data.installEvents24h ?? 0}
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
              Instalaciones CLI (7 días)
            </p>
            <p className="mt-1 tabular-nums font-mono text-sm text-on-surface">
              {data.installEvents7d ?? 0}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
        {/* Dist-tags */}
        <section className="flex min-h-[200px] flex-col overflow-hidden rounded-lg border border-border bg-footer shadow-sm">
          <div className="border-b border-border px-4 py-2">
            <h2 className="font-[family-name:var(--font-label)] text-xs uppercase tracking-wide text-on-surface">
              Dist-tags
            </h2>
            <p className="mt-0.5 text-[10px] text-outline">Punteros semver del registry</p>
          </div>
          {data.distTags.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-4 py-6 text-center text-sm text-outline">
              Sin dist-tags.
            </p>
          ) : (
            <ul className="flex-1 divide-y divide-border">
              {data.distTags.map((t) => (
                <li
                  key={t.tag}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-container-low/50"
                >
                  <code className="rounded-xs bg-surface-container-low px-1.5 py-0.5 font-mono text-[11px] text-primary-container">
                    {t.tag}
                  </code>
                  <span className="font-mono text-xs text-on-surface-variant">→ {t.version}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Acceso rápido */}
        <section className="flex min-h-[200px] flex-col justify-between rounded-lg border border-border bg-footer p-4 shadow-sm">
          <div>
            <h2 className="font-[family-name:var(--font-label)] text-xs uppercase tracking-wide text-on-surface">
              Explorador
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-outline">
              Abrí el paquete en el explorador para ver manifiesto, changelog y archivos del tarball.
            </p>
          </div>
          <Link
            href={`/admin/artifacts?package=${encodeURIComponent(data.name)}`}
            className="mt-6 inline-flex w-fit shrink-0 items-center gap-2 rounded-xs border border-border bg-background px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">folder_open</span>
            Abrir en Packages
          </Link>
        </section>
      </div>

      {/* Versiones */}
      <section className="overflow-hidden rounded-lg border border-border bg-footer shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
          <div>
            <h2 className="font-[family-name:var(--font-label)] text-xs uppercase tracking-wide text-on-surface">
              Versiones
            </h2>
            <p className="text-[10px] text-outline">Ordenadas por fecha de creación</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead className="border-b border-border bg-surface-container-low/40">
              <tr>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] text-[10px] uppercase text-outline">
                  Versión
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] text-[10px] uppercase text-outline">
                  Estado
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] text-[10px] uppercase text-outline">
                  Creado
                </th>
                <th className="px-4 py-2 font-[family-name:var(--font-label)] text-[10px] uppercase text-outline">
                  SHA-256
                </th>
                <th className="px-4 py-2 text-right font-[family-name:var(--font-label)] text-[10px] uppercase text-outline">
                  Descarga
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.versions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-outline">
                    No hay versiones publicadas aún.
                  </td>
                </tr>
              ) : (
                data.versions.map((v) => {
                  const vs =
                    versionStatusChip[v.status] ?? {
                      dot: "bg-outline",
                      text: "text-on-surface-variant",
                      label: v.status.toUpperCase(),
                    };
                  return (
                    <tr key={v.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-4 py-3">
                        <code className="font-mono text-sm font-medium text-on-surface">{v.version}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-widest ${vs.text}`}
                        >
                          <span className={`h-2 w-2 shrink-0 rounded-full ${vs.dot}`} aria-hidden />
                          {vs.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-on-surface-variant">
                        {relativeTimeEs(v.createdAt)}
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate font-mono text-[10px] text-outline"
                            title={v.checksumSha256}
                          >
                            {shortChecksum(v.checksumSha256)}
                          </span>
                          <button
                            type="button"
                            onClick={() => void copySha(v.id, v.checksumSha256)}
                            className="shrink-0 rounded-xs p-1 text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface"
                            title="Copiar SHA-256 completo"
                            aria-label="Copiar SHA-256"
                          >
                            <span className="material-symbols-outlined text-[16px] leading-none">
                              {copiedShaFor === v.id ? "check" : "content_copy"}
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/api/v1/artifacts/${encodeURIComponent(data.name)}/tarball/${encodeURIComponent(v.version)}`}
                          className="inline-flex items-center gap-1 rounded-xs border border-border bg-background px-2 py-1 font-mono text-[11px] text-on-surface transition-colors hover:bg-surface-container-low hover:border-outline"
                          download
                        >
                          <span className="material-symbols-outlined text-[16px] text-outline">download</span>
                          .tgz
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
