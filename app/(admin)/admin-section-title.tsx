"use client";

import { usePathname } from "next/navigation";

/** Pure helper — usable en tests */
export function getAdminSectionTitle(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "Dashboard";
  if (pathname.startsWith("/admin/artifact-library")) return "Artifact library";
  if (pathname.startsWith("/admin/artifacts")) return "Packages";
  if (pathname.startsWith("/admin/tokens")) return "Security";
  if (pathname.startsWith("/admin/workspaces")) return "Workspaces";
  if (pathname.startsWith("/admin/profile")) return "Perfil";
  if (pathname.startsWith("/admin/help")) return "Help";
  if (pathname.startsWith("/admin/api-docs")) return "API docs";
  return "Panel";
}

export function AdminSectionTitle() {
  const pathname = usePathname();
  const title = getAdminSectionTitle(pathname);

  return (
    <h1 className="font-[family-name:var(--font-label)] text-sm font-bold leading-none tracking-tight text-on-surface truncate">
      {title}
    </h1>
  );
}
