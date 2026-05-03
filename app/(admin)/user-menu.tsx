"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type MeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

function avatarLetter(user: MeUser | null): string {
  if (!user) return "?";
  const n = user.name?.trim();
  if (n?.length) return n.slice(0, 1).toUpperCase();
  const e = user.email?.trim();
  if (e?.length) return e.slice(0, 1).toUpperCase();
  return "?";
}

async function logout(): Promise<void> {
  await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "/login";
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadMe = useCallback(async () => {
    setLoadError(null);
    const res = await fetch("/api/v1/auth/me", { credentials: "include" });
    const j = (await res.json()) as { user?: MeUser; error?: { message?: string } };
    if (!res.ok) {
      setLoadError(j.error?.message ?? "No se pudo cargar el usuario");
      setUser(null);
      return;
    }
    if (j.user) setUser(j.user);
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const letter = avatarLetter(user);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[11px] font-bold text-white border border-border-strong hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de cuenta"
        onClick={() => setOpen((v) => !v)}
      >
        {letter}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Cuenta"
          className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xs border border-border bg-footer shadow-xl py-1 backdrop-blur-sm"
        >
          <div className="px-3 py-2 border-b border-border">
            {loadError ? (
              <p className="text-xs text-error">{loadError}</p>
            ) : user ? (
              <>
                <p className="text-sm font-medium text-on-surface truncate" title={user.name}>
                  {user.name}
                </p>
                <p className="text-xs text-outline truncate mt-0.5" title={user.email}>
                  {user.email}
                </p>
                <p className="text-[10px] text-outline mt-1 font-mono uppercase tracking-wide">{user.role}</p>
              </>
            ) : (
              <p className="text-xs text-outline">Cargando…</p>
            )}
          </div>

          <Link
            href="/admin/profile"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="material-symbols-outlined text-base text-outline">person</span>
            Perfil del usuario
          </Link>

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors text-left"
            onClick={() => void logout()}
          >
            <span className="material-symbols-outlined text-base text-outline">logout</span>
            Salir
          </button>
        </div>
      ) : null}
    </div>
  );
}
