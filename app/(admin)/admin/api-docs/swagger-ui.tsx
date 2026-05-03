"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "swagger-ui-dist/swagger-ui.css";
import "./swagger-ui-theme.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-on-surface-variant">Cargando documentación…</p>
    </div>
  ),
});

export function SwaggerApiDocs() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/v1/openapi.json", { credentials: "same-origin" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json: unknown = await res.json();
        if (!cancelled) setSpec(json as Record<string, unknown>);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar OpenAPI");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-error">No se pudo cargar el contrato: {error}</p>
      </div>
    );
  }
  if (!spec) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-on-surface-variant">Cargando OpenAPI…</p>
      </div>
    );
  }

  return (
    <div className="swagger-ui-theme explorer-scrollbar min-h-0 flex-1 overflow-auto rounded-sm border border-border bg-surface-container-lowest p-3 [&_.swagger-ui]:text-[13px]">
      <SwaggerUI spec={spec} docExpansion="list" deepLinking />
    </div>
  );
}
