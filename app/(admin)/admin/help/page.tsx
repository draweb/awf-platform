import Link from "next/link";

const helpSections = [
  {
    slug: "getting-started",
    icon: "rocket_launch",
    title: "Primeros pasos",
    description: "Cómo instalar el CLI, conectarte al registry y publicar tu primer artefacto.",
    color: "text-primary-container",
    gradient: "from-primary-container/10",
  },
  {
    slug: "artifacts",
    icon: "package_2",
    title: "Artefactos y versiones",
    description: "Crear, versionar, deprecar y eliminar artefactos. Dist-tags, resolve y tarball.",
    color: "text-tertiary",
    gradient: "from-tertiary/10",
  },
  {
    slug: "workspaces",
    icon: "deployed_code",
    title: "Workspaces",
    description: "Declarar workspaces, vincular artefactos, exportar awf-workspace.json para el CLI.",
    color: "text-secondary",
    gradient: "from-secondary/10",
  },
  {
    slug: "authentication",
    icon: "shield_lock",
    title: "Autenticación y PAT",
    description: "Device flow, sesión del panel, scopes de PAT, revocación y buenas prácticas.",
    color: "text-primary",
    gradient: "from-primary/10",
  },
  {
    slug: "api-reference",
    icon: "code",
    title: "Referencia API",
    description: "Documentación OpenAPI interactiva, códigos de error, rate limiting y headers.",
    color: "text-on-surface-variant",
    gradient: "from-on-surface-variant/10",
  },
  {
    slug: "cli",
    icon: "terminal",
    title: "CLI awf",
    description: "Comandos disponibles, flags, lockfile, install, publish, workspace list y login.",
    color: "text-tertiary",
    gradient: "from-tertiary/10",
  },
] as const;

export default function HelpIndexPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-0 pb-10">
        <header className="awf-fade-up space-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">
            Centro de ayuda
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-outline">
            Encontrá guías, referencias y buenas prácticas para aprovechar al máximo AWF.
            Cada sección incluye ejemplos prácticos y enlaces relevantes.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {helpSections.map((section, i) => (
            <Link
              key={section.slug}
              href={`/admin/help/${section.slug}`}
              className={`group relative flex flex-col overflow-hidden rounded-sm border border-border bg-footer transition-all duration-300 hover:border-border-strong hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)] awf-fade-up ${
                i > 0 ? "awf-fade-up-delay" : ""
              }`}
              style={i > 1 ? { animationDelay: `${Math.min(i * 60, 300)}ms` } : undefined}
            >
              {/* Gradient accent */}
              <div
                className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${section.gradient} to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
              />

              <div className="relative flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-border bg-surface-container-low transition-colors duration-200 group-hover:bg-surface-container">
                    <span
                      className={`material-symbols-outlined text-xl ${section.color} transition-transform duration-300 group-hover:scale-110`}
                    >
                      {section.icon}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-on-surface">
                    {section.title}
                  </h2>
                </div>

                <p className="flex-1 text-xs leading-relaxed text-on-surface-variant">
                  {section.description}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-outline transition-colors duration-200 group-hover:text-primary">
                  <span>Ver guía</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick links footer */}
        <section className="awf-fade-up rounded-sm border border-border bg-footer p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-outline">
                support_agent
              </span>
              <div>
                <p className="text-sm font-medium text-on-surface">
                  ¿No encontrás lo que buscás?
                </p>
                <p className="mt-0.5 text-xs text-outline leading-relaxed">
                  Revisá la documentación API interactiva o consultá al equipo en el canal interno.
                </p>
              </div>
            </div>
            <Link
              href="/admin/api-docs"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-primary-container/50 bg-primary-container/10 px-4 py-2 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary-container/20"
            >
              <span className="material-symbols-outlined text-sm">description</span>
              API docs
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
