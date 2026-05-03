"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/components/ui/alert-provider";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  maintainer: "Mantenedor",
  publisher: "Publicador",
  consumer: "Consumidor",
};

function roleLabel(role: string): string {
  const k = role.toLowerCase();
  return ROLE_LABELS[k] ?? role;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function SettingsUsersPage() {
  const { showError } = useAlert();
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setForbidden(false);
    const res = await fetch("/api/v1/admin/users", { credentials: "include" });
    const j = (await res.json()) as { items?: UserRow[]; error?: { message?: string; code?: string } };

    if (res.status === 403) {
      setForbidden(true);
      setItems([]);
      return;
    }

    if (!res.ok) {
      showError(j.error?.message ?? "No se pudo cargar el listado de usuarios.");
      setItems([]);
      return;
    }

    setItems(j.items ?? []);
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
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Usuarios de la plataforma</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-outline">
            Cuentas con acceso al panel y la API. Solo los administradores pueden ver este listado.
          </p>
        </header>

        {forbidden ? (
          <div className="rounded-sm border border-border bg-footer px-4 py-3 text-sm text-outline">
            No tenés permiso para ver usuarios. Iniciá sesión como administrador del panel.
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-outline">Cargando usuarios…</p>
        ) : !forbidden ? (
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-border bg-surface-container-low text-outline">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Rol</th>
                  <th className="px-3 py-2 font-medium">Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-footer">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-outline">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  items.map((u) => (
                    <tr key={u.id} className="text-on-surface-variant">
                      <td className="px-3 py-2.5 font-medium text-on-surface">{u.name}</td>
                      <td className="px-3 py-2.5">{u.email}</td>
                      <td className="px-3 py-2.5">{roleLabel(u.role)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-outline">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
