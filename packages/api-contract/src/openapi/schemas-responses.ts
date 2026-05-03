/**
 * Schemas de respuesta y cuerpos alineados con handlers (campos documentados + additionalProperties donde el servidor devuelve más).
 */

const iso = { type: "string", format: "date-time" } as const;

export const openApiResponseSchemas = {
  HealthOkResponse: {
    type: "object",
    required: ["status", "db", "ts"],
    properties: {
      status: { type: "string", enum: ["ok"] },
      db: { type: "string", enum: ["up"] },
      ts: iso,
    },
  },
  HealthDegradedResponse: {
    type: "object",
    required: ["status", "db", "ts"],
    properties: {
      status: { type: "string", enum: ["degraded"] },
      db: { type: "string", enum: ["down"] },
      ts: iso,
    },
  },
  HousekeepingOkResponse: {
    type: "object",
    required: ["deletedSessions"],
    properties: { deletedSessions: { type: "integer", minimum: 0 } },
  },
  AuthMeResponse: {
    type: "object",
    required: ["user", "authMethod"],
    properties: {
      user: {
        type: "object",
        required: ["id", "email", "name", "role", "createdAt"],
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          role: { type: "string", description: "Rol de aplicación (admin, maintainer, consumer, …)" },
          createdAt: iso,
        },
      },
      authMethod: { type: "string", enum: ["session", "pat"] },
      scopes: {
        type: "array",
        items: { type: "string" },
        description: "Presente cuando `authMethod` es `pat`: scopes del token.",
      },
      cliAccessTokenId: {
        type: "string",
        description: "Reservado para extensiones futuras; puede no estar presente.",
      },
    },
  },
  ResolveOkResponse: {
    type: "object",
    required: ["name", "version", "checksumSha256", "tarballUrl"],
    properties: {
      name: { type: "string", description: "Nombre canónico del artefacto" },
      version: { type: "string", description: "Versión SemVer resuelta" },
      checksumSha256: { type: "string", description: "SHA-256 del tarball publicado" },
      tarballUrl: { type: "string", description: "URL absoluta o clave interna de almacenamiento" },
      deprecated: {
        type: "boolean",
        description: "true si la versión está deprecated en el registry (sigue instalable)",
      },
    },
  },
  /** Fila de versión en listados GET …/versions (select del handler). */
  ArtifactVersionSummary: {
    type: "object",
    properties: {
      id: { type: "string" },
      version: { type: "string" },
      status: { type: "string", description: "p. ej. draft | published | deprecated | yanked" },
      checksumSha256: { type: "string" },
      sizeBytes: { type: "integer", nullable: true },
      createdAt: iso,
      publishedAt: { type: "string", format: "date-time", nullable: true },
    },
    additionalProperties: true,
  },
  ArtifactVersionsListResponse: {
    type: "object",
    required: ["versions"],
    properties: {
      versions: { type: "array", items: { $ref: "#/components/schemas/ArtifactVersionSummary" } },
    },
  },
  ArtifactVersionDetailResponse: {
    type: "object",
    required: ["version"],
    properties: {
      version: {
        description: "Registro `artifact_version` (manifest, changelog, tarballUrl, estados, etc.).",
        allOf: [{ $ref: "#/components/schemas/ArtifactVersionSummary" }],
      },
    },
  },
  /** Fila `dist_tags` alineada a Prisma (`GET` detalle de artefacto incluye relación completa). */
  DistTagRow: {
    type: "object",
    properties: {
      id: { type: "string" },
      artifactId: { type: "string" },
      tag: { type: "string" },
      version: { type: "string" },
      updatedBy: { type: "string" },
      updatedAt: iso,
    },
    additionalProperties: true,
  },
  /** Fila completa `artifact_versions` (include en GET `…/artifacts/{encodedName}`). */
  ArtifactVersionFull: {
    type: "object",
    description: "Versión con manifest, tarball y auditoría; no confundir con el select acotado del listado `GET …/versions`.",
    properties: {
      id: { type: "string" },
      artifactId: { type: "string" },
      version: { type: "string" },
      status: { type: "string", description: "draft | published | deprecated | yanked" },
      manifest: { type: "object", additionalProperties: true, description: "JSON `awf.asset.json` almacenado." },
      changelog: { type: "string" },
      tarballUrl: { type: "string" },
      checksumSha256: { type: "string" },
      sizeBytes: { type: "integer", nullable: true },
      createdBy: { type: "string" },
      publishedBy: { type: "string", nullable: true },
      createdAt: iso,
      publishedAt: { type: "string", format: "date-time", nullable: true },
    },
    additionalProperties: true,
  },
  /** GET /artifacts — ítem con última versión publicada opcional. */
  ArtifactCatalogItem: {
    type: "object",
    description: "Artefacto con relación `versions` (última publicada) según implementación.",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: { type: "string" },
      description: { type: "string" },
      visibility: { type: "string" },
      owner: { type: "string" },
      createdAt: iso,
      updatedAt: iso,
      versions: { type: "array", items: { $ref: "#/components/schemas/ArtifactVersionSummary" } },
    },
    additionalProperties: true,
  },
  ArtifactListResponse: {
    type: "object",
    required: ["items", "nextCursor"],
    properties: {
      items: { type: "array", items: { $ref: "#/components/schemas/ArtifactCatalogItem" } },
      nextCursor: { type: "string", nullable: true, description: "Cursor para la siguiente página o null." },
    },
  },
  ArtifactCreateResponse: {
    type: "object",
    required: ["artifact"],
    properties: { artifact: { $ref: "#/components/schemas/ArtifactCatalogItem" } },
  },
  /** GET /artifacts/{encodedName} — cuerpo plano (spread del modelo Prisma `Artifact` + type API). */
  ArtifactDetailResponse: {
    type: "object",
    description:
      "Mismo shape que `prisma.artifact.findUnique({ include: { versions, distTags } })` más `type` en nomenclatura API (`artifactTypeToApi`). Versiones ordenadas por `createdAt` descendente.",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: {
        type: "string",
        description: "Cadena API (p. ej. rule, skill); el enum Prisma `ArtifactType` se mapea en el handler.",
      },
      description: { type: "string" },
      owner: { type: "string" },
      visibility: {
        type: "string",
        enum: ["private", "internal", "public"],
        description: "ArtifactVisibility",
      },
      status: {
        type: "string",
        enum: ["active", "deprecated", "archived"],
        description: "ArtifactStatus",
      },
      createdAt: iso,
      updatedAt: iso,
      versions: {
        type: "array",
        items: { $ref: "#/components/schemas/ArtifactVersionFull" },
      },
      distTags: {
        type: "array",
        items: { $ref: "#/components/schemas/DistTagRow" },
      },
    },
    additionalProperties: true,
  },
  ArtifactPatchResponse: {
    type: "object",
    required: ["artifact"],
    properties: { artifact: { $ref: "#/components/schemas/ArtifactCatalogItem" } },
  },
  DistTagRowResponse: {
    type: "object",
    properties: { tag: { type: "object", additionalProperties: true } },
  },
  DistTagsListResponse: {
    type: "object",
    required: ["tags"],
    properties: {
      tags: {
        type: "array",
        items: { $ref: "#/components/schemas/DistTagRow" },
      },
    },
  },
  SearchArtifactsResponse: {
    type: "object",
    required: ["items"],
    properties: {
      items: { type: "array", items: { $ref: "#/components/schemas/ArtifactCatalogItem" } },
    },
  },
  InstallEventCreatedResponse: {
    type: "object",
    required: ["event"],
    properties: { event: { type: "object", additionalProperties: true } },
  },
  AdminStatsResponse: {
    type: "object",
    required: ["artifacts", "versions", "installEvents24h"],
    properties: {
      artifacts: { type: "integer", minimum: 0 },
      versions: { type: "integer", minimum: 0 },
      installEvents24h: { type: "integer", minimum: 0 },
    },
  },
  AdminDashboardWorkspaceRow: {
    type: "object",
    required: ["id", "slug", "name", "status", "updatedAt"],
    properties: {
      id: { type: "string" },
      slug: { type: "string" },
      name: { type: "string" },
      status: { type: "string", enum: ["draft", "active", "archived"] },
      updatedAt: iso,
    },
  },
  AdminDashboardTopArtifactRow: {
    type: "object",
    required: ["artifactName", "count"],
    properties: {
      artifactName: { type: "string" },
      count: { type: "integer", minimum: 0 },
    },
  },
  AdminDashboardActivityLine: {
    type: "object",
    required: ["id", "kind", "at", "tag", "message"],
    properties: {
      id: { type: "string" },
      kind: { type: "string", enum: ["audit", "install"] },
      at: iso,
      tag: { type: "string" },
      message: { type: "string" },
    },
  },
  AdminDashboardResponse: {
    type: "object",
    required: [
      "artifacts",
      "versions",
      "libraries",
      "versionsPublished",
      "versionsDraftReview",
      "versionsDeprecatedYanked",
      "installEvents24h",
      "installEvents7d",
      "distinctInstallUsers7d",
      "installTrend7d",
      "recentWorkspaces",
      "topArtifactsByInstalls7d",
      "activityFeed",
    ],
    properties: {
      artifacts: { type: "integer", minimum: 0 },
      versions: { type: "integer", minimum: 0 },
      libraries: { type: "integer", minimum: 0 },
      versionsPublished: {
        type: "integer",
        minimum: 0,
        description: "Versiones con estado `published`.",
      },
      versionsDraftReview: {
        type: "integer",
        minimum: 0,
        description: "Versiones en `draft` o `review`.",
      },
      versionsDeprecatedYanked: {
        type: "integer",
        minimum: 0,
        description: "Versiones `deprecated` o `yanked`.",
      },
      installEvents24h: { type: "integer", minimum: 0 },
      installEvents7d: { type: "integer", minimum: 0 },
      distinctInstallUsers7d: { type: "integer", minimum: 0 },
      installTrend7d: {
        type: "array",
        description: "Un contador por día UTC (7 elementos, del más antiguo al más reciente).",
        items: { type: "integer", minimum: 0 },
        minItems: 7,
        maxItems: 7,
      },
      recentWorkspaces: {
        type: "array",
        items: { $ref: "#/components/schemas/AdminDashboardWorkspaceRow" },
      },
      topArtifactsByInstalls7d: {
        type: "array",
        items: { $ref: "#/components/schemas/AdminDashboardTopArtifactRow" },
      },
      activityFeed: {
        type: "array",
        items: { $ref: "#/components/schemas/AdminDashboardActivityLine" },
      },
    },
  },
  AdminUserRow: {
    type: "object",
    required: ["id", "email", "name", "role", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      email: { type: "string", format: "email" },
      name: { type: "string" },
      role: { type: "string", description: "UserRole del modelo Prisma" },
      createdAt: iso,
      updatedAt: iso,
    },
  },
  AdminUsersListResponse: {
    type: "object",
    required: ["items"],
    properties: {
      items: { type: "array", items: { $ref: "#/components/schemas/AdminUserRow" } },
    },
  },
  CursorAuditLogsResponse: {
    type: "object",
    required: ["items", "nextCursor"],
    properties: {
      items: { type: "array", items: { type: "object", additionalProperties: true } },
      nextCursor: { type: "string", nullable: true },
    },
  },
  CursorInstallEventsAdminResponse: {
    type: "object",
    required: ["items", "nextCursor"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          description: "InstallEvent con `artifact.name` incluido.",
          additionalProperties: true,
        },
      },
      nextCursor: { type: "string", nullable: true },
    },
  },
  WorkspaceListResponse: {
    type: "object",
    required: ["items", "nextCursor"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "slug", "name", "artifactCount", "ownerId"],
          properties: {
            id: { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            semver: { type: "string" },
            status: { type: "string", enum: ["draft", "active", "archived"] },
            stacks: { type: "array", items: { type: "string" } },
            updatedAt: iso,
            artifactCount: { type: "integer" },
            ownerId: { type: "string" },
          },
        },
      },
      nextCursor: { type: "string", nullable: true },
    },
  },
  PatListResponse: {
    type: "object",
    required: ["items", "availableScopes"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            tokenPrefix: { type: "string" },
            scopes: { type: "array", items: { type: "string" } },
            lastUsedAt: { type: "string", format: "date-time", nullable: true },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            createdAt: iso,
          },
        },
      },
      availableScopes: { type: "array", items: { type: "string" } },
    },
  },
  PatCreateResponse: {
    type: "object",
    required: ["token", "id", "tokenPrefix", "name", "scopes", "createdAt", "warning"],
    properties: {
      token: { type: "string", description: "Valor completo del PAT; solo se muestra en esta respuesta." },
      id: { type: "string" },
      tokenPrefix: { type: "string" },
      name: { type: "string" },
      scopes: { type: "array", items: { type: "string" } },
      createdAt: iso,
      expiresAt: { type: "string", format: "date-time", nullable: true },
      warning: { type: "string" },
    },
  },
  WorkspaceArtifactsPutResponse: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["artifactId", "order"],
          properties: {
            artifactId: { type: "string" },
            pinnedVersion: { type: "string", nullable: true },
            order: { type: "integer" },
          },
        },
      },
    },
  },
  AwfWorkspaceJsonSnapshot: {
    type: "object",
    description: "Snapshot consumible por el CLI (`name`, `version`, `stacks`, `instructionsMarkdown`, `artifacts`).",
    additionalProperties: true,
  },
  WorkspaceCreateResponse: {
    type: "object",
    required: ["workspace"],
    properties: {
      workspace: {
        type: "object",
        description: "Workspace recién creado (sin artefactos vinculados aún).",
        additionalProperties: true,
      },
    },
  },
  WorkspaceDetailResponse: {
    type: "object",
    required: ["workspace"],
    properties: {
      workspace: {
        type: "object",
        description:
          "Detalle serializado: constitution parseada, artifacts con `type` API, fechas ISO. Ver handler `serializeWorkspace`.",
        additionalProperties: true,
      },
    },
  },
  PatRenameResponse: {
    type: "object",
    required: ["item"],
    properties: {
      item: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          tokenPrefix: { type: "string" },
          scopes: { type: "array", items: { type: "string" } },
          lastUsedAt: { ...iso, nullable: true },
          expiresAt: { ...iso, nullable: true },
          createdAt: iso,
        },
        additionalProperties: true,
      },
    },
  },

  /* ── Libraries ── */

  LibraryCreateBody: {
    type: "object",
    required: ["name", "slug"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 120 },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      description: { type: "string", maxLength: 500 },
    },
  },
  LibraryPatchBody: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 120 },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      description: { type: "string", maxLength: 500 },
    },
  },
  LibraryListResponse: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            ownerId: { type: "string" },
            updatedAt: iso,
            artifactCount: { type: "integer" },
          },
        },
      },
      nextCursor: { type: "string", nullable: true },
    },
  },
  LibraryDetailResponse: {
    type: "object",
    required: ["library"],
    properties: {
      library: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          ownerId: { type: "string" },
          createdAt: iso,
          updatedAt: iso,
          artifacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                artifactId: { type: "string" },
                name: { type: "string" },
                type: { type: "string" },
                description: { type: "string" },
                pinnedVersion: { type: "string", nullable: true },
                order: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
  LibraryArtifactsPutBody: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["artifactId"],
          properties: {
            artifactId: { type: "string" },
            pinnedVersion: { type: "string", nullable: true },
            order: { type: "integer" },
          },
        },
      },
    },
  },
  LibraryArtifactsResponse: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            artifactId: { type: "string" },
            name: { type: "string" },
            type: { type: "string" },
            description: { type: "string" },
            pinnedVersion: { type: "string", nullable: true },
            order: { type: "integer" },
          },
        },
      },
    },
  },
  WorkspaceLibrariesPutBody: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["libraryId"],
          properties: {
            libraryId: { type: "string" },
            order: { type: "integer" },
          },
        },
      },
    },
  },
  WorkspaceLibrariesResponse: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            libraryId: { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            artifactCount: { type: "integer" },
            order: { type: "integer" },
          },
        },
      },
    },
  },
};
