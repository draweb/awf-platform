import type { Scope } from "./scopes";
import { SCOPES } from "./scopes";

export type ScopeCatalogEntry = {
  label: string;
  description: string;
  danger?: true;
};

export const SCOPE_DESCRIPTIONS: Record<Scope, ScopeCatalogEntry> = {
  "artifact:read": {
    label: "Lectura de artefactos",
    description: "Listar, resolver versiones y descargar tarballs.",
  },
  "artifact:write": {
    label: "Escritura de artefactos",
    description: "Crear o actualizar metadatos de artefactos (no publicar).",
  },
  "artifact:publish": {
    label: "Publicar versiones",
    description: "Subir versiones y publicar en el registry.",
  },
  "artifact:deprecate": {
    label: "Deprecar / yank",
    description: "Marcar versiones como deprecadas o retirarlas.",
  },
  "tag:write": {
    label: "Dist-tags",
    description: "Actualizar etiquetas tipo latest sobre versiones.",
  },
  "admin:read": {
    label: "Admin lectura",
    description: "Ver estadísticas y registros de auditoría del panel.",
  },
  "admin:write": {
    label: "Admin total",
    description: "Acceso administrativo completo al registry (equivalente a bypass de scopes).",
    danger: true,
  },
};

export function assertScopeCatalogComplete(): void {
  for (const s of SCOPES) {
    if (!(s in SCOPE_DESCRIPTIONS)) {
      throw new Error(`SCOPE_DESCRIPTIONS falta entrada para: ${s}`);
    }
  }
}
