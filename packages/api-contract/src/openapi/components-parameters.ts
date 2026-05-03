/**
 * Parámetros reutilizables (`$ref: "#/components/parameters/..."`).
 * Mejoran consistencia y descripciones en Swagger UI.
 */
export const openApiParameters = {
  encodedArtifactName: {
    name: "encodedName",
    in: "path" as const,
    required: true,
    description:
      "Nombre canónico del artefacto (p. ej. `@awf/rules`) codificado con **encodeURIComponent** para el segmento de URL. Ejemplo: `%40awf%2Frules`.",
    schema: { type: "string" as const },
    example: "%40awf%2Frules",
  },
  semverVersion: {
    name: "version",
    in: "path" as const,
    required: true,
    description: "Versión SemVer del paquete (mismo string que en el registry).",
    schema: { type: "string" as const },
    example: "1.0.0",
  },
  distTagName: {
    name: "tag",
    in: "path" as const,
    required: true,
    description: "Nombre del dist-tag (`latest`, `beta`, etc.). Si contiene caracteres especiales, codificar el segmento de URL.",
    schema: { type: "string" as const },
    example: "latest",
  },
  workspaceId: {
    name: "id",
    in: "path" as const,
    required: true,
    description: "ID UUID del workspace.",
    schema: { type: "string", format: "uuid" as const },
  },
  patId: {
    name: "id",
    in: "path" as const,
    required: true,
    description: "ID UUID del token PAT.",
    schema: { type: "string", format: "uuid" as const },
  },
  limitArtifacts: {
    name: "limit",
    in: "query" as const,
    description: "Tamaño de página (máx. 100). Por defecto 50.",
    schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
  },
  cursorOpaque: {
    name: "cursor",
    in: "query" as const,
    description: "Cursor opaco devuelto en `nextCursor` de la página anterior.",
    schema: { type: "string" },
  },
  limitAdmin: {
    name: "limit",
    in: "query" as const,
    description: "Tamaño de página (máx. 200). Por defecto 50.",
    schema: { type: "integer", default: 50, minimum: 1, maximum: 200 },
  },
  searchQuery: {
    name: "q",
    in: "query" as const,
    description: "Texto de búsqueda. Menos de 2 caracteres devuelve `items: []`.",
    schema: { type: "string" },
  },
  searchArtifactType: {
    name: "type",
    in: "query" as const,
    description: "Filtro por tipo de artefacto en nomenclatura API (p. ej. `rule`, `skill`).",
    schema: { type: "string" },
  },
  /** `GET /api/v1/artifacts` — mismo nombre `q` que búsqueda; aquí menos de 2 caracteres no aplica filtro de texto. */
  artifactCatalogQuery: {
    name: "q",
    in: "query" as const,
    description:
      "Texto en nombre o descripción (`contains`, case insensitive). Con menos de 2 caracteres **no** se filtra por texto (útil con `type`/`status`/`visibility` solos).",
    schema: { type: "string" },
  },
  artifactCatalogType: {
    name: "type",
    in: "query" as const,
    description: "Filtro por tipo en nomenclatura API (`skill`, `cursor-rule`, etc.). Combinable con `q`, `status`, `visibility`.",
    schema: { type: "string" },
  },
  artifactCatalogStatus: {
    name: "status",
    in: "query" as const,
    description: "Filtro por estado del artefacto.",
    schema: { type: "string", enum: ["active", "deprecated", "archived"] },
  },
  artifactCatalogVisibility: {
    name: "visibility",
    in: "query" as const,
    description: "Filtro por visibilidad.",
    schema: { type: "string", enum: ["private", "internal", "public"] },
  },
  resolveRange: {
    name: "range",
    in: "query" as const,
    description: "Rango SemVer estilo npm (p. ej. `^1.0.0`). Mutuamente excluyente con `tag` para la resolución.",
    schema: { type: "string" },
    example: "^1.0.0",
  },
  resolveTag: {
    name: "tag",
    in: "query" as const,
    description: "Dist-tag a usar para resolver (p. ej. `latest`). Si se omite y no hay `range`, se usa el tag `latest` si existe.",
    schema: { type: "string" },
  },
  workspaceListStatus: {
    name: "status",
    in: "query" as const,
    schema: { type: "string", enum: ["draft", "active", "archived"] },
    description: "Filtrar workspaces por estado.",
  },
  workspaceListQ: {
    name: "q",
    in: "query" as const,
    description: "Búsqueda por nombre o slug (contains, case insensitive).",
    schema: { type: "string" },
  },
  libraryId: {
    name: "id",
    in: "path" as const,
    required: true,
    description: "ID de la biblioteca de artefactos.",
    schema: { type: "string" as const },
  },
  limitWorkspaces: {
    name: "limit",
    in: "query" as const,
    schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
    description: "Tamaño de página para listados de workspace.",
  },
};
