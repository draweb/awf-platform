import { z } from "zod";

/** Bloque de texto constitucional (título + cuerpo markdown + viñetas opcionales). */
export const sectionBlockSchema = z.object({
  title: z.string(),
  body: z.string(),
  bullets: z.array(z.string()).optional().default([]),
});

export type SectionBlock = z.infer<typeof sectionBlockSchema>;

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

export type Constitution = z.infer<typeof constitutionSchema>;

const emptyBlock = (): SectionBlock => ({ title: "", body: "", bullets: [] });

/** Plantilla inicial para crear un workspace nuevo. */
export const EMPTY_CONSTITUTION: Constitution = {
  identity: emptyBlock(),
  stackContext: emptyBlock(),
  principles: [],
  restrictions: [],
  coding: [],
  security: [],
  qualityTesting: [],
  collaboration: [],
  glossary: [],
};

/**
 * Ejemplos precargados para el drawer de constitución y para workspaces nuevos.
 * Orientado a un agente copiloto que genera rules/skills a partir del proyecto.
 *
 * Complementa (sin duplicar) el Markdown de playbook en
 * `workspace-new-default-markdown.ts`: allí van repo, comandos, MCP y validación;
 * aquí la política del equipo en bloques estructurados.
 */
export const EXAMPLE_CONSTITUTION: Constitution = {
  identity: {
    title: "Backoffice interno — inventario y pedidos",
    body:
      "Workspace para equipos que centralizan **reglas de Cursor**, skills y comandos alineados al producto. El copiloto debe inferir configuración desde el repo real y pedir solo lo que falte.",
    bullets: [
      "Propósito: operadores de depósito y administradores de catálogo.",
      "Criticidad media: errores afectan logística, no pagos en tiempo real.",
      "Idioma de salida del agente: español; commits y PRs según convención del repo.",
    ],
  },
  stackContext: {
    title: "Next.js (App Router) + Prisma + Postgres",
    body:
      "Monorepo típico con `apps/web` (Next.js), `packages/*` compartidos y Prisma bajo `apps/web/prisma`. Deploy orientado a Vercel; CLI y contratos en `packages/api-contract`.",
    bullets: [
      "pnpm como gestor de paquetes.",
      "TypeScript estricto; validación con Zod en handlers.",
      "Tailwind + tokens del tema; componentes en `components/`, dominio en `lib/domain/`.",
    ],
  },
  principles: [
    {
      title: "Single source of truth",
      body:
        "Reglas de negocio y validaciones viven en dominio reutilizable; el panel y la API consumen las mismas funciones.",
      bullets: [
        "No duplicar lógica solo en UI.",
        "Contratos HTTP y tipos compartidos cuando exista `api-contract`.",
      ],
    },
    {
      title: "Transparencia para el agente",
      body:
        "Cada rule o skill generada debe poder comprobarse con lint, test o checklist explícito.",
      bullets: ["Preferir reglas cortas y verificables.", "Evitar filosofía genérica sin acción."],
    },
  ],
  restrictions: [
    {
      title: "Superficie y dependencias",
      body:
        "Reducir superficie de ataque y de mantenimiento: nuevas dependencias solo con justificación en PR.",
      bullets: [
        "Prohibido `any` sin comentario que explique la excepción.",
        "No credenciales, PAT ni URLs con secretos en rules o skills.",
        "No SQL concatenado; usar ORM o queries parametrizadas.",
      ],
    },
  ],
  coding: [
    {
      title: "Convenciones de archivos y capas",
      body:
        "`app/` delgado (routing y layouts); `lib/domain/` con reglas puras; `components/` sin efectos de negocio.",
      bullets: [
        "Módulos `kebab-case.ts`; componentes React `PascalCase.tsx`.",
        "`\"use client\"` solo donde haga falta interactividad.",
        "Imports con alias `@/`; evitar cadenas `../../../`.",
      ],
    },
  ],
  security: [
    {
      title: "Auth, datos y límites",
      body:
        "Sesión panel con cookie httpOnly; API con PAT en CLI. Autorización explícita en mutaciones sensibles.",
      bullets: [
        "Validar todo input en servidor antes de tocar la base.",
        "Rate limiting en login, subidas y endpoints costosos.",
        "Revisión humana en cambios de auth, permisos y datos personales.",
      ],
    },
  ],
  qualityTesting: [
    {
      title: "Pruebas y cierre de tarea",
      body:
        "Vitest (o el runner del repo) para dominio y utilidades; integración en handlers cuando aplique.",
      bullets: [
        "Tras cambios: ejecutar tests acotados al módulo tocado.",
        "Si no hay harness: indicar N/A y proponer un test mínimo cuando la lógica sea no trivial.",
      ],
    },
  ],
  collaboration: [
    {
      title: "Pull requests",
      body:
        "Descripción en español: qué cambia, por qué y cómo probarlo localmente (`pnpm lint`, `pnpm test`, etc.).",
      bullets: [
        "Screenshots si hay cambio de UI.",
        "Riesgos y follow-ups cuando el alcance lo amerite.",
      ],
    },
  ],
  glossary: [
    {
      title: "Términos AWF / registry",
      body:
        "Glosario mínimo para que el copiloto no confunda conceptos del ecosistema Agent Workspace Factory.",
      bullets: [
        "Registry: URL base del servicio donde se publican artefactos.",
        "Manifest: archivo `awf.asset.json` que describe un paquete.",
        "PAT: token personal enviado como `Authorization: Bearer` desde el CLI.",
        "Dist-tag: etiqueta tipo npm (`latest`, `beta`) que apunta a una versión SemVer.",
      ],
    },
  ],
};

function renderBlock(heading: string, block: SectionBlock): string[] {
  const out: string[] = [];
  const title = block.title.trim();
  const body = block.body.trim();
  const bullets = (block.bullets ?? []).map((b) => b.trim()).filter(Boolean);
  if (!title && !body && bullets.length === 0) return out;
  out.push(`## ${heading}`);
  if (title) out.push(`### ${title}`);
  if (body) out.push(body);
  for (const b of bullets) out.push(`- ${b}`);
  out.push("");
  return out;
}

function renderBlockList(sectionTitle: string, blocks: SectionBlock[]): string[] {
  const out: string[] = [];
  const nonEmpty = blocks.filter(
    (b) => b.title.trim() || b.body.trim() || (b.bullets ?? []).some((x) => x.trim()),
  );
  if (nonEmpty.length === 0) return out;
  out.push(`## ${sectionTitle}`);
  for (const block of nonEmpty) {
    const title = block.title.trim();
    const body = block.body.trim();
    const bullets = (block.bullets ?? []).map((b) => b.trim()).filter(Boolean);
    if (title) out.push(`### ${title}`);
    if (body) out.push(body);
    for (const b of bullets) out.push(`- ${b}`);
    out.push("");
  }
  return out;
}

export type WorkspaceMarkdownMeta = {
  name?: string;
  slug?: string;
  semver?: string;
};

/**
 * Genera Markdown canónico desde la constitución estructurada.
 * Orden fijo de secciones (identidad → glosario).
 */
export function buildWorkspaceMarkdown(c: Constitution, meta?: WorkspaceMarkdownMeta): string {
  const header: string[] = [];
  if (meta?.name?.trim()) header.push(`# ${meta.name.trim()}`);
  if (meta?.slug?.trim() || meta?.semver?.trim()) {
    const bits = [meta?.slug?.trim() && `slug: \`${meta.slug.trim()}\``, meta?.semver?.trim() && `versión: ${meta.semver.trim()}`].filter(
      Boolean,
    ) as string[];
    if (bits.length) header.push(bits.join(" · "));
    header.push("");
  }

  const body: string[] = [
    ...renderBlock("Identidad", c.identity),
    ...renderBlock("Contexto de stack", c.stackContext),
    ...renderBlockList("Principios", c.principles),
    ...renderBlockList("Restricciones", c.restrictions),
    ...renderBlockList("Estilo de código", c.coding),
    ...renderBlockList("Seguridad", c.security),
    ...renderBlockList("Calidad y pruebas", c.qualityTesting),
    ...renderBlockList("Colaboración", c.collaboration),
    ...renderBlockList("Glosario", c.glossary),
  ];

  const merged = [...header, ...body].join("\n").trimEnd();
  return merged ? `${merged}\n` : "";
}
