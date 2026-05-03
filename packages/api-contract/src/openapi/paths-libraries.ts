import { E } from "./response-errors.js";

const sec: Array<Record<string, string[]>> = [{ BearerAuth: [] }, { CookieSession: [] }];
const pref = (name: string) => ({ $ref: `#/components/parameters/${name}` });
const S = (schema: string) => ({ $ref: `#/components/schemas/${schema}` });

export const pathsLibraries = {
  "/api/v1/libraries": {
    get: {
      operationId: "listLibraries",
      tags: ["Libraries"],
      summary: "Listar bibliotecas de artefactos",
      security: sec,
      parameters: [pref("limitWorkspaces"), pref("cursorOpaque"), pref("workspaceListQ")],
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("LibraryListResponse") } } },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "500": E.internal("Error interno"),
      },
    },
    post: {
      operationId: "createLibrary",
      tags: ["Libraries"],
      summary: "Crear biblioteca de artefactos",
      security: sec,
      requestBody: {
        required: true,
        content: { "application/json": { schema: S("LibraryCreateBody") } },
      },
      responses: {
        "200": { description: "Creada", content: { "application/json": { schema: S("LibraryDetailResponse") } } },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "409": E.conflict("Slug duplicado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/libraries/{id}": {
    get: {
      operationId: "getLibrary",
      tags: ["Libraries"],
      summary: "Detalle de biblioteca",
      security: sec,
      parameters: [pref("libraryId")],
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("LibraryDetailResponse") } } },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrada"),
        "500": E.internal("Error interno"),
      },
    },
    patch: {
      operationId: "patchLibrary",
      tags: ["Libraries"],
      summary: "Actualizar biblioteca",
      security: sec,
      parameters: [pref("libraryId")],
      requestBody: {
        required: false,
        content: { "application/json": { schema: S("LibraryPatchBody") } },
      },
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("LibraryDetailResponse") } } },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrada"),
        "409": E.conflict("Slug duplicado"),
        "500": E.internal("Error interno"),
      },
    },
    delete: {
      operationId: "deleteLibrary",
      tags: ["Libraries"],
      summary: "Eliminar biblioteca",
      security: sec,
      parameters: [pref("libraryId")],
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("OkTrue") } } },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrada"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/libraries/{id}/artifacts": {
    get: {
      operationId: "getLibraryArtifacts",
      tags: ["Libraries"],
      summary: "Listar artefactos de biblioteca",
      security: sec,
      parameters: [pref("libraryId")],
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("LibraryArtifactsResponse") } } },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrada"),
        "500": E.internal("Error interno"),
      },
    },
    put: {
      operationId: "putLibraryArtifacts",
      tags: ["Libraries"],
      summary: "Reemplazar artefactos de biblioteca",
      security: sec,
      parameters: [pref("libraryId")],
      requestBody: {
        required: true,
        content: { "application/json": { schema: S("LibraryArtifactsPutBody") } },
      },
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("LibraryArtifactsResponse") } } },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrada"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/workspaces/{id}/libraries": {
    get: {
      operationId: "getWorkspaceLibraries",
      tags: ["Workspaces"],
      summary: "Listar bibliotecas vinculadas al workspace",
      security: sec,
      parameters: [pref("workspaceId")],
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("WorkspaceLibrariesResponse") } } },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
    put: {
      operationId: "putWorkspaceLibraries",
      tags: ["Workspaces"],
      summary: "Reemplazar bibliotecas del workspace",
      security: sec,
      parameters: [pref("workspaceId")],
      requestBody: {
        required: true,
        content: { "application/json": { schema: S("WorkspaceLibrariesPutBody") } },
      },
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("WorkspaceLibrariesResponse") } } },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "429": E.rateLimited("Demasiadas mutaciones de workspace"),
        "500": E.internal("Error interno"),
      },
    },
  },
};
