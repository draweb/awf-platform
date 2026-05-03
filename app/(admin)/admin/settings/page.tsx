import Link from "next/link";

const settingsSections = [
  {
    href: "/admin/settings/users",
    icon: "group",
    title: "Usuarios de la plataforma",
    description:
      "Listado de cuentas con rol en el registry. La gestión de cuentas está reservada a administradores.",
    color: "text-primary-container",
    gradient: "from-primary-container/10",
    badge: "Solo admin",
  },
  {
    href: "/admin/tokens",
    icon: "shield_lock",
    title: "Tokens personales (PAT)",
    description: "Crear, renombrar y revocar PAT para el CLI. Scopes, expiración y último uso.",
    color: "text-primary",
    gradient: "from-primary/10",
  },
  {
    href: "/admin/settings/api",
    icon: "monitoring",
    title: "API y uso",
    description:
      "Métricas agregadas, eventos de instalación CLI y enlace a la documentación OpenAPI interactiva.",
    color: "text-secondary",
    gradient: "from-secondary/10",
  },
] as const;

export default function SettingsIndexPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-0 pb-10">
        <header className="awf-fade-up space-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Configuración</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-outline">
            Preferencias del registry, seguridad y visibilidad operativa. Elegí una sección para continuar.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {settingsSections.map((section, i) => (
            <Link
              key={section.href}
              href={section.href}
              className={`group relative flex flex-col overflow-hidden rounded-sm border border-border bg-footer transition-all duration-300 hover:border-border-strong hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)] awf-fade-up ${
                i > 0 ? "awf-fade-up-delay" : ""
              }`}
              style={i > 1 ? { animationDelay: `${Math.min(i * 60, 300)}ms` } : undefined}
            >
              <div
                className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${section.gradient} to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
              />

              <div className="relative flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-border bg-surface-container-low transition-colors duration-200 group-hover:bg-surface-container">
                    <span
                      className={`material-symbols-outlined text-xl ${section.color} transition-transform duration-300 group-hover:scale-110`}
                    >
                      {section.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-on-surface">{section.title}</h2>
                      {"badge" in section && section.badge ? (
                        <span className="rounded-xs border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-outline">
                          {section.badge}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="flex-1 text-xs leading-relaxed text-on-surface-variant">{section.description}</p>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-outline transition-colors duration-200 group-hover:text-primary">
                  <span>Abrir</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section className="awf-fade-up rounded-sm border border-border bg-footer p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-outline">menu_book</span>
              <div>
                <p className="text-sm font-medium text-on-surface">Documentación y perfil</p>
                <p className="mt-0.5 text-xs leading-relaxed text-outline">
                  La referencia HTTP completa está en API docs; tu cuenta y contraseña en el perfil.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/admin/api-docs"
                className="inline-flex items-center gap-2 rounded-sm border border-primary-container/50 bg-primary-container/10 px-4 py-2 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary-container/20"
              >
                <span className="material-symbols-outlined text-sm">description</span>
                API docs
              </Link>
              <Link
                href="/admin/profile"
                className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-xs font-medium text-on-surface transition-colors duration-200 hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Perfil
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
