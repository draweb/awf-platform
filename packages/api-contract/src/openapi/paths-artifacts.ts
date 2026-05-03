import { E } from "./response-errors.js";

const secPatOrCookie: Array<Record<string, string[]>> = [{ BearerAuth: [] }, { CookieSession: [] }];

/** Slug → nombre del parámetro en `components.parameters` */
const paramRefs = {
  enc: "encodedArtifactName",
  ver: "semverVersion",
  tag: "distTagName",
  limA: "limitArtifacts",
  cur: "cursorOpaque",
  rng: "resolveRange",
  tq: "resolveTag",
  qCat: "artifactCatalogQuery",
  typeCat: "artifactCatalogType",
  stCat: "artifactCatalogStatus",
  visCat: "artifactCatalogVisibility",
} as const;

const p = (name: keyof typeof paramRefs) => ({ $ref: `#/components/parameters/${paramRefs[name]}` });

const S = (schema: string) => ({ $ref: `#/components/schemas/${schema}` });

export const pathsArtifacts = {
  "/api/v1/artifacts": {
    get: {
      operationId: "listArtifacts",
      tags: ["Artifacts"],
      summary: "Listar artefactos",
      description:
        "Catálogo paginado por cursor (`limit`, `cursor`). Filtros opcionales: `q` (nombre o descripción, mín. 2 caracteres), `type`, `status`, `visibility`. Orden: `createdAt` descendente. Requiere scope de lectura de artefactos.",
      security: secPatOrCookie,
      parameters: [p("limA"), p("cur"), p("qCat"), p("typeCat"), p("stCat"), p("visCat")],
      responses: {
        "200": {
          description: "Lista paginada",
          content: { "application/json": { schema: S("ArtifactListResponse") } },
        },
        "400": E.validation("Query inválido (tipo/estado/visibilidad desconocidos)"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin scope artifact:read"),
        "500": E.internal("Error interno"),
      },
    },
    post: {
      operationId: "createArtifact",
      tags: ["Artifacts"],
      summary: "Crear artefacto",
      security: secPatOrCookie,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ArtifactCreateBody" },
            examples: {
              rulePackage: {
                summary: "Artefacto tipo rule",
                value: {
                  name: "@acme/cursor-rules",
                  type: "rule",
                  description: "Reglas compartidas del equipo",
                  visibility: "internal",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Creado",
          content: { "application/json": { schema: S("ArtifactCreateResponse") } },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "409": E.conflict("Nombre duplicado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}": {
    get: {
      operationId: "getArtifactByName",
      tags: ["Artifacts"],
      summary: "Detalle de artefacto",
      description:
        "Devuelve el modelo del artefacto **en la raíz del JSON** (no está envuelto en `{ artifact: … }`), con `type` en nomenclatura API y relaciones `versions` y `distTags`.",
      security: secPatOrCookie,
      parameters: [p("enc")],
      responses: {
        "200": {
          description: "Artefacto",
          content: { "application/json": { schema: S("ArtifactDetailResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
    patch: {
      operationId: "patchArtifact",
      tags: ["Artifacts"],
      summary: "Actualizar artefacto",
      security: secPatOrCookie,
      parameters: [p("enc")],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ArtifactPatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Actualizado",
          content: { "application/json": { schema: S("ArtifactPatchResponse") } },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
    delete: {
      operationId: "deleteArtifact",
      tags: ["Artifacts"],
      summary: "Eliminar artefacto",
      security: secPatOrCookie,
      parameters: [p("enc")],
      responses: {
        "200": {
          description: "Eliminado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/OkTrue" } } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/resolve": {
    get: {
      operationId: "resolveArtifactVersion",
      tags: ["Artifacts"],
      summary: "Resolver versión (range, tag o latest)",
      description:
        "Sin query: intenta el dist-tag `latest`. Con `tag`: usa ese dist-tag. Con `range`: aplica comparador SemVer sobre versiones publicadas. Rate limit aplicado por IP/actor.",
      security: secPatOrCookie,
      parameters: [p("enc"), p("rng"), p("tq")],
      responses: {
        "200": {
          description: "Versión resuelta",
          content: { "application/json": { schema: S("ResolveOkResponse") } },
        },
        "400": E.validation("Rango inválido"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No resuelto"),
        "429": E.rateLimited("Rate limit"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/versions": {
    get: {
      operationId: "listArtifactVersions",
      tags: ["Artifacts"],
      summary: "Listar versiones",
      security: secPatOrCookie,
      parameters: [p("enc")],
      responses: {
        "200": {
          description: "Todas las versiones del artefacto (orden descendente por creación).",
          content: { "application/json": { schema: S("ArtifactVersionsListResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("Artefacto no encontrado"),
        "500": E.internal("Error interno"),
      },
    },
    post: {
      operationId: "publishArtifactVersionMultipart",
      tags: ["Artifacts"],
      summary: "Publicar versión (multipart)",
      description:
        "Content-Type obligatorio: `multipart/form-data`. Campos: `version` (SemVer), `changelog` (texto), `manifest` (parte archivo `application/json` **o** string JSON), `tarball` (archivo `.tgz`), `tag` (opcional: actualiza dist-tag al publicar).",
      security: secPatOrCookie,
      parameters: [p("enc")],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["version", "changelog", "manifest", "tarball"],
              properties: {
                version: { type: "string", example: "1.0.0" },
                changelog: { type: "string", description: "Notas de la versión" },
                manifest: {
                  oneOf: [{ type: "string", format: "binary" }, { type: "string", description: "JSON inline" }],
                  description: "Manifest `awf.asset.json` como archivo o texto JSON",
                },
                tarball: { type: "string", format: "binary", description: "Archivo .tgz del paquete" },
                tag: { type: "string", description: "Opcional: dist-tag a mover a esta versión" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Versión creada/publicada",
          content: { "application/json": { schema: S("ArtifactVersionDetailResponse") } },
        },
        "400": E.manifestInvalid("Validación o manifest inválido"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("Artefacto no encontrado"),
        "409": E.versionExists("Versión ya existe"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/versions/{version}": {
    get: {
      operationId: "getArtifactVersion",
      tags: ["Artifacts"],
      summary: "Detalle de una versión",
      security: secPatOrCookie,
      parameters: [p("enc"), p("ver")],
      responses: {
        "200": {
          description: "Registro de versión (incluye manifest almacenado).",
          content: { "application/json": { schema: S("ArtifactVersionDetailResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/versions/{version}/publish": {
    post: {
      operationId: "publishArtifactVersionState",
      tags: ["Artifacts"],
      summary: "Marcar versión como publicada",
      description: "Si ya estaba publicada, la respuesta puede incluir mensaje informativo.",
      security: secPatOrCookie,
      parameters: [p("enc"), p("ver")],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  version: { $ref: "#/components/schemas/ArtifactVersionSummary" },
                  message: { type: "string", description: "Presente cuando ya estaba publicada" },
                },
                additionalProperties: true,
              },
            },
          },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/versions/{version}/deprecate": {
    post: {
      operationId: "deprecateArtifactVersion",
      tags: ["Artifacts"],
      summary: "Deprecar versión",
      security: secPatOrCookie,
      parameters: [p("enc"), p("ver")],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { version: { $ref: "#/components/schemas/ArtifactVersionSummary" } },
                additionalProperties: true,
              },
            },
          },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/versions/{version}/yank": {
    post: {
      operationId: "yankArtifactVersion",
      tags: ["Artifacts"],
      summary: "Yank de versión",
      security: secPatOrCookie,
      parameters: [p("enc"), p("ver")],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { version: { $ref: "#/components/schemas/ArtifactVersionSummary" } },
                additionalProperties: true,
              },
            },
          },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/tags": {
    get: {
      operationId: "listDistTags",
      tags: ["Artifacts"],
      summary: "Listar dist-tags",
      security: secPatOrCookie,
      parameters: [p("enc")],
      responses: {
        "200": {
          description: "Lista de dist-tags",
          content: { "application/json": { schema: S("DistTagsListResponse") } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/tags/{tag}": {
    put: {
      operationId: "putDistTag",
      tags: ["Artifacts"],
      summary: "Crear o actualizar dist-tag",
      security: secPatOrCookie,
      parameters: [p("enc"), p("tag")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TagPutBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Tag guardado",
          content: { "application/json": { schema: S("DistTagRowResponse") } },
        },
        "400": E.validation("Validación"),
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
    delete: {
      operationId: "deleteDistTag",
      tags: ["Artifacts"],
      summary: "Eliminar dist-tag",
      security: secPatOrCookie,
      parameters: [p("enc"), p("tag")],
      responses: {
        "200": {
          description: "Eliminado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/OkTrue" } } },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
  "/api/v1/artifacts/{encodedName}/tarball/{version}": {
    get: {
      operationId: "downloadArtifactTarball",
      tags: ["Artifacts"],
      summary: "Descargar tarball",
      description:
        "Almacenamiento local: `200` con cuerpo `application/gzip` y cabecera `X-Checksum-Sha256`. Almacenamiento remoto (Vercel Blob u otro): `302 Found` a la URL firmada.",
      security: secPatOrCookie,
      parameters: [p("enc"), p("ver")],
      responses: {
        "200": {
          description: "Cuerpo gzip",
          headers: {
            "Content-Disposition": {
              schema: { type: "string" },
              description: "attachment; filename=\"…\"",
            },
            "X-Checksum-Sha256": {
              schema: { type: "string" },
              description: "Checksum de la versión publicada",
            },
          },
          content: {
            "application/gzip": { schema: { type: "string", format: "binary" } },
          },
        },
        "302": {
          description: "Redirección a URL de descarga remota",
          headers: {
            Location: { schema: { type: "string", format: "uri" } },
          },
        },
        "401": E.unauthorized("No autenticado"),
        "403": E.forbidden("Sin permiso"),
        "404": E.notFound("No encontrado"),
        "500": E.internal("Error interno"),
      },
    },
  },
};
