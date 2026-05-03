"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminHeaderRowClassName } from "./admin-chrome";

function isDashboardPath(pathname: string): boolean {
  return pathname === "/admin" || pathname === "/admin/";
}

/**
 * Activity bar: rail distinto del lienzo; filas homogéneas (h-11) con iconos apagados
 * hasta hover/activo. La marca va en la franja superior (alto = header del shell).
 */
type ActivityItem = {
  href: string;
  icon: string;
  label: string;
  /** Si no se define, activo cuando pathname === href o empieza por href + "/" */
  isActive?: (pathname: string) => boolean;
};

const activityItems: ActivityItem[] = [
  {
    href: "/admin",
    icon: "dashboard",
    label: "Dashboard",
    isActive: isDashboardPath,
  },
  { href: "/admin/workspaces", icon: "space_dashboard", label: "Workspaces" },
  { href: "/admin/artifacts", icon: "package_2", label: "Packages" },
  { href: "/admin/artifact-library", icon: "library_books", label: "Artifact library" },
];

const bottomNavItems = [
  { href: "/admin/help", icon: "help", label: "Help" },
  { href: "/admin/settings", icon: "settings", label: "Configuración" },
] as const;

const NAV_ICON_CLASS =
  "material-symbols-outlined shrink-0 !text-[36px] leading-none transition-opacity duration-150";

function isActivityActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav() {
  const pathname = usePathname();
  const dashboardActive = isDashboardPath(pathname);

  const activityLinkBase =
    "relative flex h-11 w-full items-center justify-center gap-0 px-0 transition-colors duration-150 ease-out group-hover:justify-start group-hover:gap-3 group-hover:px-3";

  return (
    <aside
      className="group fixed left-0 top-0 z-40 flex h-full w-12 flex-col overflow-hidden border-r border-border bg-surface-container-lowest transition-all duration-200 ease-in-out hover:w-64"
      aria-label="Navegación principal"
    >
      {/* Marca — misma altura que el header del shell */}
      <div
        className={`flex ${adminHeaderRowClassName} shrink-0 border-b border-border bg-background`}
      >
        <Link
          href="/admin"
          aria-label="AWF · Dashboard"
          aria-current={dashboardActive ? "page" : undefined}
          className={`${activityLinkBase} min-h-0 w-full ${dashboardActive
            ? "text-primary-container before:absolute before:left-0 before:top-1/2 before:h-8 before:w-px before:-translate-y-1/2 before:bg-primary-container bg-footer/80"
            : "text-outline/70 hover:bg-footer hover:text-on-surface"
            }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs border border-white/10 bg-primary-container shadow-sm">
            <span className="material-symbols-outlined text-[26px] leading-none text-white">terminal</span>
          </div>
          <div className="hidden min-w-0 flex-1 flex-col gap-0.5 overflow-hidden group-hover:flex">
            <span className="font-[family-name:var(--font-label)] text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-on-surface">
              AWF
            </span>
            <span className="font-mono text-[9px] leading-tight text-outline">
              Agent Workspace Factory · <span className="text-outline/90">LOCAL</span>
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto overflow-x-hidden py-2">
        {activityItems.map((item) => {
          const active = item.isActive
            ? item.isActive(pathname)
            : isActivityActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`${activityLinkBase} ${active
                ? "text-primary-container before:absolute before:left-0 before:top-1/2 before:h-8 before:w-px before:-translate-y-1/2 before:bg-primary-container bg-footer/80"
                : "text-outline/70 hover:bg-footer hover:text-on-surface"
                }`}
            >
              <span className={`${NAV_ICON_CLASS} ${active ? "opacity-100" : "opacity-90 group-hover:opacity-100"}`}>
                {item.icon}
              </span>
              <span className="min-w-0 max-w-0 overflow-hidden font-[family-name:var(--font-label)] text-[11px] font-medium whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 ease-in-out group-hover:max-w-[200px] group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-px border-t border-border bg-background py-1">
        {bottomNavItems.map((item) => {
          const active = isActivityActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`${activityLinkBase} ${active
                ? "text-primary-container before:absolute before:left-0 before:top-1/2 before:h-8 before:w-px before:-translate-y-1/2 before:bg-primary-container bg-footer/80"
                : "text-outline/70 hover:bg-footer hover:text-on-surface"
                }`}
            >
              <span className={`${NAV_ICON_CLASS} ${active ? "opacity-100" : "opacity-90 group-hover:opacity-100"}`}>
                {item.icon}
              </span>
              <span className="min-w-0 max-w-0 overflow-hidden font-[family-name:var(--font-label)] text-[11px] font-medium whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 ease-in-out group-hover:max-w-[200px] group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
