import type { UserRole } from "@prisma/client";
import type { Actor } from "@/lib/auth/get-actor";
import { hasScope, type Scope } from "@/lib/auth/scopes";
import { ApiError } from "@/lib/http/errors";

function roleAtLeast(role: UserRole, min: UserRole): boolean {
  const order: UserRole[] = ["consumer", "publisher", "maintainer", "admin"];
  return order.indexOf(role) >= order.indexOf(min);
}

export function canWriteArtifact(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return hasScope(actor.scopes, "artifact:write") || hasScope(actor.scopes, "artifact:publish");
  }
  return roleAtLeast(actor.role, "publisher");
}

export function canPublishVersion(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return hasScope(actor.scopes, "artifact:publish");
  }
  return roleAtLeast(actor.role, "publisher");
}

export function canDeprecate(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return hasScope(actor.scopes, "artifact:deprecate") || hasScope(actor.scopes, "artifact:publish");
  }
  return roleAtLeast(actor.role, "maintainer");
}

export function canWriteDistTag(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return hasScope(actor.scopes, "tag:write") || hasScope(actor.scopes, "artifact:publish");
  }
  return roleAtLeast(actor.role, "publisher");
}

export function canAdminStats(actor: Actor): boolean {
  if (actor.authMethod === "pat") return hasScope(actor.scopes, "admin:read");
  return roleAtLeast(actor.role, "maintainer");
}

/** Listar usuarios de plataforma: solo sesión de panel con rol admin (no PAT). */
export function canManageUsers(actor: Actor): boolean {
  if (actor.authMethod !== "session") return false;
  return actor.role === "admin";
}

/** Listar/leer catálogo y metadatos (CLI con PAT necesita artifact:read o superior). */
export function canReadArtifactCatalog(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return (
      hasScope(actor.scopes, "artifact:read") ||
      hasScope(actor.scopes, "artifact:write") ||
      hasScope(actor.scopes, "artifact:publish") ||
      hasScope(actor.scopes, "admin:read")
    );
  }
  return true;
}

export function requirePatScope(actor: Actor, scope: Scope): void {
  if (actor.authMethod !== "pat") return;
  if (!hasScope(actor.scopes, scope)) {
    throw new ApiError({ code: "FORBIDDEN", httpStatus: 403, message: `Scope requerido: ${scope}` });
  }
}

/** Listar / leer workspaces (panel maintainer+; PAT admin:read o artifact:read). */
export function canReadWorkspace(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return hasScope(actor.scopes, "admin:read") || hasScope(actor.scopes, "artifact:read");
  }
  return roleAtLeast(actor.role, "maintainer");
}

/** Crear workspace (panel maintainer+; PAT admin:write). */
export function canCreateWorkspace(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return hasScope(actor.scopes, "admin:write");
  }
  return roleAtLeast(actor.role, "maintainer");
}

/** Editar / eliminar / asociar artefactos: dueño o admin de panel; PAT admin:write solo sobre recursos propios. */
export function canWriteWorkspace(actor: Actor, workspace: { ownerId: string }): boolean {
  if (actor.authMethod === "pat") {
    if (!hasScope(actor.scopes, "admin:write")) return false;
    return workspace.ownerId === actor.userId;
  }
  if (actor.role === "admin") return true;
  return workspace.ownerId === actor.userId;
}

/** Cambiar slug (inmutable salvo admin / PAT con admin:write sobre el recurso). */
export function canChangeWorkspaceSlug(actor: Actor): boolean {
  if (actor.authMethod === "pat") {
    return hasScope(actor.scopes, "admin:write");
  }
  return actor.role === "admin";
}

/** Listar / leer libraries (mismos permisos que workspaces). */
export function canReadLibrary(actor: Actor): boolean {
  return canReadWorkspace(actor);
}

/** Crear library (mismos permisos que workspaces). */
export function canCreateLibrary(actor: Actor): boolean {
  return canCreateWorkspace(actor);
}

/** Ver detalle de una biblioteca concreta (misma lógica que canViewWorkspace). */
export function canViewLibrary(actor: Actor, library: { ownerId: string }): boolean {
  if (actor.authMethod === "pat") {
    return library.ownerId === actor.userId;
  }
  if (actor.role === "admin") return true;
  return library.ownerId === actor.userId;
}

/** Editar / eliminar library: dueño o admin; PAT admin:write solo sobre propios. */
export function canWriteLibrary(actor: Actor, library: { ownerId: string }): boolean {
  if (actor.authMethod === "pat") {
    if (!hasScope(actor.scopes, "admin:write")) return false;
    return library.ownerId === actor.userId;
  }
  if (actor.role === "admin") return true;
  return library.ownerId === actor.userId;
}

/** Ver detalle / JSON de un workspace concreto (tras pasar canReadWorkspace a nivel API). */
export function canViewWorkspace(actor: Actor, workspace: { ownerId: string }): boolean {
  if (actor.authMethod === "pat") {
    return workspace.ownerId === actor.userId;
  }
  if (actor.role === "admin") return true;
  return workspace.ownerId === actor.userId;
}
