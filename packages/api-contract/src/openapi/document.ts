import { openApiComponents } from "./components.js";
import { pathsArtifacts } from "./paths-artifacts.js";
import { pathsAuth } from "./paths-auth.js";
import { pathsHealthCronValidate } from "./paths-health-cron-validate.js";
import { pathsDeviceAuth } from "./paths-device.js";
import { pathsLibraries } from "./paths-libraries.js";
import { pathsWorkspacesPatAdminSearchInstall } from "./paths-workspaces-pat-admin.js";
import { workspacePatchBodyJsonSchema } from "../zod/workspace-patch.js";

/**
 * Documento OpenAPI 3.0 de la API pública AWF (`/api/v1`).
 * Mantener alineado con los Route Handlers en `apps/web/app/api/v1`.
 */
export const openApiDocument: Record<string, unknown> = {
  openapi: "3.0.3",
  info: {
    title: "Agent Workspace Factory API",
    version: "0.1.0",
    description:
      "API HTTP versionada del registry AWF. Autenticación: PAT (`Authorization: Bearer awf_pat_…`) para CLI e integraciones, o cookie `awf_session` para el panel. Los nombres de artefacto en path van con `encodeURIComponent`.",
    "x-awf-future": {
      webhooks:
        "Reservado: no hay webhooks en v1; eventos de registry consumibles vía CLI, panel o extensiones futuras sobre esta API.",
    },
  },
  servers: [{ url: "/", description: "Mismo origen que despliega apps/web (ajustá en el cliente si consumís otro host)." }],
  tags: [
    { name: "Health", description: "Salud del servicio" },
    { name: "Auth", description: "Sesión panel y perfil" },
    { name: "Artifacts", description: "Registry de artefactos y versiones" },
    { name: "Search", description: "Búsqueda" },
    { name: "InstallEvents", description: "Telemetría de instalación CLI" },
    { name: "Workspaces", description: "Workspaces declarativos" },
    { name: "Libraries", description: "Bibliotecas de artefactos" },
    { name: "PersonalAccessTokens", description: "PAT (solo sesión panel)" },
    { name: "Admin", description: "Operaciones administrativas" },
    { name: "Validate", description: "Validación de manifest/tarball" },
    { name: "Cron", description: "Jobs internos (Vercel Cron)" },
  ],
  paths: {
    ...pathsHealthCronValidate,
    ...pathsAuth,
    ...pathsDeviceAuth,
    ...pathsArtifacts,
    ...pathsLibraries,
    ...pathsWorkspacesPatAdminSearchInstall,
  },
  components: {
    ...openApiComponents,
    schemas: {
      ...openApiComponents.schemas,
      WorkspacePatchBody: {
        ...workspacePatchBodyJsonSchema,
        description:
          "Cuerpo PATCH parcial. Generado desde Zod en este paquete (`workspacePatchBodyZod`); mantener alineado con `apps/web/lib/domain/workspace-validate.ts` y `workspaces/[id]/route.ts`.",
      },
    },
  },
};
