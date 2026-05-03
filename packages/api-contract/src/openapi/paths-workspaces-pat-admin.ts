import { E } from "./response-errors.js";

const secPatOrCookie: Array<Record<string, string[]>> = [{ BearerAuth: [] }, { CookieSession: [] }];

const pref = (name: string) => ({ $ref: `#/components/parameters/${name}` });

const S = (schema: string) => ({ $ref: `#/components/schemas/${schema}` });

export const pathsWorkspacesPatAdminSearchInstall = {
  "/api/v1/search": {
    get: {
      operationId: "searchArtifacts",
      tags: ["Search"],
      summary: "Buscar artefactos",
      description: "Búsqueda por nombre o descripción. Con menos de 2 caracteres en `q` la API devuelve `items: []`.",
      security: secPatOrCookie,
      parameters: [pref("searchQuery"), pref("searchArtifactType")],
      responses: {
        "200": {
          description: "Resultados",
          content: { "application/json": { schema: S("SearchArtifactsResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/install-events": {
    post: {
      operationId: "recordInstallEvent",
      tags: ["InstallEvents"],
      summary: "Registrar evento de instalación (CLI)",
      security: secPatOrCookie,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/InstallEventBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Creado",
          content: { "application/json": { schema: S("InstallEventCreatedResponse") } },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Scope PAT insuficiente (artifact:read)."),
        "404": E.notFound("Artefacto no encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/workspaces": {
    get: {
      operationId: "listWorkspaces",
      tags: ["Workspaces"],
      summary: "Listar workspaces",
      description: "PAT o sesión. Los consumers solo ven sus workspaces salvo rol admin.",
      security: secPatOrCookie,
      parameters: [pref("limitWorkspaces"), pref("cursorOpaque"), pref("workspaceListStatus"), pref("workspaceListQ")],
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("WorkspaceListResponse") } } },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "500": E.internal("Error interno"),
      },
    },
    post: {
      operationId: "createWorkspace",
      tags: ["Workspaces"],
      summary: "Crear workspace",
      security: secPatOrCookie,
      requestBody: {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/WorkspaceCreateBody" },
          },
        },
      },
      responses: {
        "200": { description: "Creado", content: { "application/json": { schema: S("WorkspaceCreateResponse") } } },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "409": E.conflict("Slug duplicado"),
        "429": E.rateLimited("Demasiadas mutaciones de workspace"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/workspaces/{id}": {
    get: {
      operationId: "getWorkspace",
      tags: ["Workspaces"],
      summary: "Detalle workspace",
      security: secPatOrCookie,
      parameters: [pref("workspaceId")],
      responses: {
        "200": {
          description: "OK",
          content: { "application/json": { schema: S("WorkspaceDetailResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
    patch: {
      operationId: "patchWorkspace",
      tags: ["Workspaces"],
      summary: "Actualizar workspace",
      security: secPatOrCookie,
      parameters: [pref("workspaceId")],
      requestBody: {
        required: false,
        description:
          "Generado desde Zod en `packages/api-contract/src/zod/workspace-patch.ts` (sincronizar con el handler). Todos los campos opcionales.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/WorkspacePatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "OK",
          content: { "application/json": { schema: S("WorkspaceDetailResponse") } },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "409": E.conflict("Slug duplicado"),
        "429": E.rateLimited("Demasiadas mutaciones de workspace"),
        "500": E.internal("Error interno"),
      },
    },
    delete: {
      operationId: "deleteWorkspace",
      tags: ["Workspaces"],
      summary: "Eliminar workspace",
      security: secPatOrCookie,
      parameters: [pref("workspaceId")],
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/OkTrue" } } } },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "429": E.rateLimited("Demasiadas mutaciones de workspace"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/workspaces/{id}/artifacts": {
    put: {
      operationId: "putWorkspaceArtifacts",
      tags: ["Workspaces"],
      summary: "Reemplazar lista de artefactos del workspace",
      description: "Borra vínculos anteriores y crea los nuevos en una transacción; `order` por defecto es el índice del array.",
      security: secPatOrCookie,
      parameters: [pref("workspaceId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/WorkspaceArtifactsPutBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "OK",
          content: { "application/json": { schema: S("WorkspaceArtifactsPutResponse") } },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "429": E.rateLimited("Demasiadas mutaciones de workspace"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/workspaces/{id}/awf-workspace.json": {
    get: {
      operationId: "getWorkspaceSnapshotJson",
      tags: ["Workspaces"],
      summary: "Snapshot descargable awf-workspace.json",
      security: secPatOrCookie,
      parameters: [pref("workspaceId")],
      responses: {
        "200": {
          description: "JSON",
          content: { "application/json": { schema: S("AwfWorkspaceJsonSnapshot") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/user/personal-access-tokens": {
    get: {
      operationId: "listPersonalAccessTokens",
      tags: ["PersonalAccessTokens"],
      summary: "Listar PAT del usuario",
      description: "Solo sesión de panel (cookie), no PAT.",
      security: [{ CookieSession: [] }],
      responses: {
        "200": {
          description: "OK",
          content: { "application/json": { schema: S("PatListResponse") } },
        },
        "401": E.unauthorized("Solo sesión de panel (cookie), no PAT."),
        "500": E.internal("Error interno"),
      },
    },
    post: {
      operationId: "createPersonalAccessToken",
      tags: ["PersonalAccessTokens"],
      summary: "Crear PAT",
      description: "Solo sesión de panel. Respuesta incluye el token completo una sola vez.",
      security: [{ CookieSession: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PatCreateBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Token emitido",
          content: { "application/json": { schema: S("PatCreateResponse") } },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("Solo sesión de panel."),
        "403": E.forbidden("Rol insuficiente para emitir PAT"),
        "409": E.conflict("Nombre de PAT duplicado"),
        "429": E.rateLimited("Demasiadas mutaciones de workspace"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/user/personal-access-tokens/{id}": {
    patch: {
      operationId: "renamePersonalAccessToken",
      tags: ["PersonalAccessTokens"],
      summary: "Renombrar PAT",
      security: [{ CookieSession: [] }],
      parameters: [pref("patId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PatRenameBody" },
          },
        },
      },
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: S("PatRenameResponse") } } },
        "400": E.validation("Validación"),
        "401": E.unauthorized("Solo sesión de panel."),
        "404": E.notFound("No encontrado"),
        "409": E.conflict("Nombre de PAT duplicado"),
        "500": E.internal("Error interno"),
      },
    },
    delete: {
      operationId: "revokePersonalAccessToken",
      tags: ["PersonalAccessTokens"],
      summary: "Revocar PAT",
      security: [{ CookieSession: [] }],
      parameters: [pref("patId")],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OkTrue" },
            },
          },
        },
        "401": E.unauthorized("Solo sesión de panel."),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/admin/stats": {
    get: {
      operationId: "getAdminStats",
      tags: ["Admin"],
      summary: "Métricas agregadas",
      security: secPatOrCookie,
      responses: {
        "200": {
          description: "Conteos",
          content: { "application/json": { schema: S("AdminStatsResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso de administración"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/admin/dashboard": {
    get: {
      operationId: "getAdminDashboard",
      tags: ["Admin"],
      summary: "Snapshot para el panel (workspaces, instalaciones CLI, actividad)",
      description:
        "Agrega conteos del registry, tendencia de instalaciones por día (UTC), workspaces recientes, ranking de paquetes instalados vía CLI (7 días) y líneas de actividad (audit + install). Requiere mismo permiso que `GET /api/v1/admin/stats`.",
      security: secPatOrCookie,
      responses: {
        "200": {
          description: "Payload del dashboard",
          content: { "application/json": { schema: S("AdminDashboardResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso de administración"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/admin/audit-logs": {
    get: {
      operationId: "listAdminAuditLogs",
      tags: ["Admin"],
      summary: "Listar audit logs",
      security: secPatOrCookie,
      parameters: [pref("limitAdmin"), pref("cursorOpaque")],
      responses: {
        "200": {
          description: "Paginado",
          content: { "application/json": { schema: S("CursorAuditLogsResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso de administración"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/admin/install-events": {
    get: {
      operationId: "listAdminInstallEvents",
      tags: ["Admin"],
      summary: "Listar install events (admin)",
      security: secPatOrCookie,
      parameters: [pref("limitAdmin"), pref("cursorOpaque")],
      responses: {
        "200": {
          description: "OK",
          content: { "application/json": { schema: S("CursorInstallEventsAdminResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso de administración"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/admin/users": {
    get: {
      operationId: "listAdminUsers",
      tags: ["Admin"],
      summary: "Listar usuarios del panel (solo rol admin, sesión cookie)",
      description:
        "No disponible con PAT. Reservado a administradores autenticados vía sesión del panel (`awf_session`).",
      security: [{ CookieSession: [] }],
      responses: {
        "200": {
          description: "Listado sin contraseñas",
          content: { "application/json": { schema: S("AdminUsersListResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Solo administradores de panel"),
        "500": E.internal("Error interno"),
      },
    },
  },
};
