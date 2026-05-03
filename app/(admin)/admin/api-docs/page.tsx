import { SwaggerApiDocs } from "./swagger-ui";

export default function AdminApiDocsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <h1 className="font-[family-name:var(--font-label)] text-sm font-semibold uppercase tracking-wider text-on-surface">
          API v1 (OpenAPI)
        </h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-on-surface-variant">
          Contrato interactivo alineado con{" "}
          <code className="rounded-xs border border-border bg-footer px-1.5 py-0.5 font-mono text-[11px] text-primary">
            GET /api/v1/openapi.json
          </code>{" "}
          para Postman, generadores de cliente y pruebas externas.
        </p>
      </div>
      <SwaggerApiDocs />
    </div>
  );
}
