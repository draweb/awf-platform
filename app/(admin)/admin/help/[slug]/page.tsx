import Link from "next/link";
import { notFound } from "next/navigation";

type HelpContent = {
  icon: string;
  title: string;
  color: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  relatedLinks?: Array<{ label: string; href: string }>;
};

const HELP_CONTENT: Record<string, HelpContent> = {
  "getting-started": {
    icon: "rocket_launch",
    title: "Primeros pasos",
    color: "text-primary-container",
    sections: [
      {
        heading: "Instalar el CLI",
        body: [
          "Ejecutá `npm install -g @awf/cli` (o `pnpm add -g @awf/cli`) para instalar el CLI de AWF globalmente.",
          "Verificá la instalación con `awf --version`.",
        ],
      },
      {
        heading: "Iniciar sesión",
        body: [
          "Usá `awf login` para iniciar el flujo de autenticación por device code.",
          "Se abrirá el navegador donde aprobás el código. El CLI queda autenticado automáticamente.",
        ],
      },
      {
        heading: "Publicar tu primer artefacto",
        body: [
          "Creá un archivo `awf.asset.json` con el nombre, tipo y versión del artefacto.",
          "Ejecutá `awf publish` desde la raíz del proyecto. El CLI empaqueta, sube el tarball y registra la versión.",
        ],
      },
      {
        heading: "Instalar artefactos",
        body: [
          "Usá `awf install @scope/nombre` para descargar e instalar un artefacto publicado.",
          "El lockfile `awf.lock.json` se actualiza automáticamente con checksums y versiones resueltas.",
        ],
      },
    ],
    relatedLinks: [
      { label: "CLI awf", href: "/admin/help/cli" },
      { label: "Autenticación y PAT", href: "/admin/help/authentication" },
    ],
  },
  artifacts: {
    icon: "package_2",
    title: "Artefactos y versiones",
    color: "text-tertiary",
    sections: [
      {
        heading: "Crear un artefacto",
        body: [
          "Desde el panel: botón \"Nuevo artefacto\" en Packages. Desde el CLI: `awf publish` crea el artefacto si no existe.",
          "Cada artefacto tiene nombre único, tipo (rule, skill, template, etc.), descripción y visibilidad.",
        ],
      },
      {
        heading: "Versiones y SemVer",
        body: [
          "Cada publicación crea una versión con número SemVer (major.minor.patch).",
          "Los estados de versión son: draft → published → deprecated | yanked.",
        ],
      },
      {
        heading: "Dist-tags",
        body: [
          "Los dist-tags (ej. `latest`, `beta`) apuntan a una versión SemVer específica.",
          "El CLI resuelve `latest` por defecto si no se especifica versión o tag.",
        ],
      },
      {
        heading: "Resolución y descarga",
        body: [
          "El endpoint `/resolve` acepta un rango SemVer o tag y devuelve la versión resuelta con checksum.",
          "La descarga del tarball puede ser directa (200 + gzip) o por redirección (302 a Blob).",
        ],
      },
    ],
    relatedLinks: [
      { label: "Referencia API", href: "/admin/help/api-reference" },
      { label: "CLI awf", href: "/admin/help/cli" },
    ],
  },
  workspaces: {
    icon: "deployed_code",
    title: "Workspaces",
    color: "text-secondary",
    sections: [
      {
        heading: "¿Qué es un workspace?",
        body: [
          "Un workspace es una colección declarativa de artefactos con una constitución (reglas, principios, stack context).",
          "Pensalo como un \"preset\" que el CLI puede instalar de una vez.",
        ],
      },
      {
        heading: "Crear y editar",
        body: [
          "Desde el panel: Workspaces → Nuevo. Completá nombre, slug, stacks, status y la constitución.",
          "El editor de constitución tiene secciones: identidad, principios, restricciones, coding, seguridad, etc.",
        ],
      },
      {
        heading: "Vincular artefactos",
        body: [
          "En la vista de detalle, arrastrá o agregá artefactos al workspace.",
          "Cada vinculación puede tener una versión fijada (`pinnedVersion`) o seguir `latest`.",
        ],
      },
      {
        heading: "Exportar para el CLI",
        body: [
          "`GET /api/v1/workspaces/{id}/awf-workspace.json` devuelve el snapshot consumible por `awf install --workspace`.",
          "Incluye nombre, versión, stacks, instructionsMarkdown y la lista de artefactos.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Artefactos y versiones", href: "/admin/help/artifacts" },
      { label: "Primeros pasos", href: "/admin/help/getting-started" },
    ],
  },
  authentication: {
    icon: "shield_lock",
    title: "Autenticación y PAT",
    color: "text-primary",
    sections: [
      {
        heading: "Métodos de autenticación",
        body: [
          "Panel: sesión con cookie httpOnly (`awf_session`). Login con email y contraseña.",
          "CLI: PAT (Personal Access Token) en `Authorization: Bearer awf_pat_…`.",
          "Device flow: el CLI solicita un código, el usuario lo aprueba en el panel.",
        ],
      },
      {
        heading: "Scopes de PAT",
        body: [
          "Cada PAT tiene scopes que limitan qué operaciones puede realizar.",
          "Scopes comunes: `artifact:read`, `artifact:publish`, `workspace:read`, `admin:write`.",
          "Los scopes no se pueden editar después de crear el token; para cambiarlos, revocá y creá otro.",
        ],
      },
      {
        heading: "Revocación",
        body: [
          "Desde el panel: Security → Revocar. El token se invalida inmediatamente.",
          "Recomendación: rotá tokens periódicamente y usá expiración.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Security (tokens)", href: "/admin/tokens" },
      { label: "CLI awf", href: "/admin/help/cli" },
    ],
  },
  "api-reference": {
    icon: "code",
    title: "Referencia API",
    color: "text-on-surface-variant",
    sections: [
      {
        heading: "OpenAPI 3.0",
        body: [
          "El spec completo está disponible en `GET /api/v1/openapi.json`.",
          "La documentación interactiva está en el panel bajo API docs (Swagger UI).",
        ],
      },
      {
        heading: "Códigos de error",
        body: [
          "Todas las respuestas de error siguen el formato `{ error: { code, message, details? } }`.",
          "Códigos estables: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, VALIDATION_ERROR, RATE_LIMITED, etc.",
        ],
      },
      {
        heading: "Rate limiting",
        body: [
          "Endpoints de resolve y device flow tienen rate limiting por IP/actor.",
          "El header `Retry-After` indica cuándo reintentar.",
        ],
      },
      {
        heading: "Versionado",
        body: [
          "Prefijo estable `/api/v1`. Cuando haya breaking changes, se agregará `/api/v2`.",
          "Los nombres de artefacto en path usan `encodeURIComponent` del nombre completo.",
        ],
      },
    ],
    relatedLinks: [
      { label: "API docs interactiva", href: "/admin/api-docs" },
      { label: "Artefactos y versiones", href: "/admin/help/artifacts" },
    ],
  },
  cli: {
    icon: "terminal",
    title: "CLI awf",
    color: "text-tertiary",
    sections: [
      {
        heading: "Comandos principales",
        body: [
          "`awf login` — autenticación por device flow.",
          "`awf publish` — empaqueta y publica una nueva versión.",
          "`awf install <nombre>` — instala un artefacto (o workspace).",
          "`awf workspace list` — lista workspaces disponibles.",
        ],
      },
      {
        heading: "Lockfile",
        body: [
          "`awf.lock.json` guarda versiones resueltas y checksums SHA-256.",
          "Se actualiza automáticamente en cada install; committearlo garantiza builds reproducibles.",
        ],
      },
      {
        heading: "User-Agent",
        body: [
          "El CLI envía `User-Agent: awf/<semver>` en cada request.",
          "El servidor puede usar esto para estadísticas y políticas de compatibilidad.",
        ],
      },
      {
        heading: "Dry-run",
        body: [
          "`awf install --dry-run` muestra el plan de instalación sin modificar archivos.",
          "Útil para auditar qué se va a instalar antes de confirmarlo.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Primeros pasos", href: "/admin/help/getting-started" },
      { label: "Autenticación y PAT", href: "/admin/help/authentication" },
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const content = HELP_CONTENT[slug];
  if (!content) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-0 pb-10">
        {/* Breadcrumb */}
        <nav className="awf-fade-up flex items-center gap-2 text-xs text-outline">
          <Link
            href="/admin/help"
            className="transition-colors duration-200 hover:text-on-surface"
          >
            Ayuda
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface-variant">{content.title}</span>
        </nav>

        {/* Article header */}
        <header className="awf-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xs border border-border bg-surface-container-low">
              <span className={`material-symbols-outlined text-2xl ${content.color}`}>
                {content.icon}
              </span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-on-surface">
              {content.title}
            </h1>
          </div>
        </header>

        {/* Content sections */}
        <div className="space-y-4">
          {content.sections.map((section, i) => (
            <section
              key={section.heading}
              className={`awf-fade-up glass-panel overflow-hidden rounded-sm border border-border-strong ${
                i > 0 ? "awf-fade-up-delay" : ""
              }`}
              style={i > 1 ? { animationDelay: `${Math.min(i * 60, 240)}ms` } : undefined}
            >
              <div className="border-b border-border bg-gradient-to-b from-surface-container-low/40 to-transparent px-5 py-3.5">
                <h2 className="text-sm font-semibold text-on-surface">{section.heading}</h2>
              </div>
              <div className="space-y-3 px-5 py-4">
                {section.body.map((paragraph, j) => (
                  <p key={j} className="text-xs leading-relaxed text-on-surface-variant">
                    {formatInlineCode(paragraph)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Related links */}
        {content.relatedLinks && content.relatedLinks.length > 0 && (
          <section className="awf-fade-up rounded-sm border border-border bg-footer p-5">
            <p className="mb-3 font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline">
              Relacionado
            </p>
            <div className="flex flex-wrap gap-2">
              {content.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-container-low px-3 py-1.5 text-xs text-on-surface-variant transition-colors duration-200 hover:border-border-strong hover:bg-surface-container hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <Link
          href="/admin/help"
          className="inline-flex items-center gap-1.5 text-xs text-outline transition-colors duration-200 hover:text-primary"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver al centro de ayuda
        </Link>
      </div>
    </div>
  );
}

function formatInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-xs border border-border bg-footer px-1.5 py-0.5 font-mono text-[11px] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
