/**
 * Esquema PATCH workspace alineado con `apps/web/app/api/v1/workspaces/[id]/route.ts`.
 * Mantener límites sincronizados con `apps/web/lib/domain/workspace-validate.ts`.
 */
import { z } from "zod";

export const MAX_WORKSPACE_NAME_LEN = 128;
export const MAX_WORKSPACE_DESCRIPTION_LEN = 1024;
export const MAX_WORKSPACE_RAW_MARKDOWN_LEN = 65_536;

const sectionBlockSchema = z.object({
  title: z.string(),
  body: z.string(),
  bullets: z.array(z.string()).optional().default([]),
});

export const constitutionSchema = z.object({
  identity: sectionBlockSchema,
  stackContext: sectionBlockSchema,
  principles: z.array(sectionBlockSchema),
  restrictions: z.array(sectionBlockSchema),
  coding: z.array(sectionBlockSchema),
  security: z.array(sectionBlockSchema),
  qualityTesting: z.array(sectionBlockSchema),
  collaboration: z.array(sectionBlockSchema),
  glossary: z.array(sectionBlockSchema),
});

/** Igual que `patchBodySchema` del handler (objeto parcial). */
export const workspacePatchBodyZod = z.object({
  name: z.string().min(1).max(MAX_WORKSPACE_NAME_LEN).optional(),
  slug: z.string().optional(),
  description: z.string().max(MAX_WORKSPACE_DESCRIPTION_LEN).optional(),
  stacks: z.array(z.string()).optional(),
  constitution: constitutionSchema.optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  semver: z.string().optional(),
  rawMarkdown: z.string().max(MAX_WORKSPACE_RAW_MARKDOWN_LEN).optional(),
  customMarkdown: z.boolean().optional(),
});

/** JSON Schema OpenAPI 3.0 para `components.schemas.WorkspacePatchBody`. */
export const workspacePatchBodyJsonSchema = z.toJSONSchema(workspacePatchBodyZod, {
  target: "openapi-3.0",
}) as Record<string, unknown>;
