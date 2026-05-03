/** Prefijo estable API pública — docs/requeriments.md §11 */
export const API_V1_PREFIX = "/api/v1" as const;

export function encodeArtifactName(name: string): string {
  return encodeURIComponent(name);
}

export function resolveUrl(baseRegistryUrl: string, artifactName: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/artifacts/${encodeArtifactName(artifactName)}/resolve`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

export function tarballUrl(baseRegistryUrl: string, artifactName: string, version: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/artifacts/${encodeArtifactName(artifactName)}/tarball/${encodeURIComponent(version)}`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

export function versionsPostUrl(baseRegistryUrl: string, artifactName: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/artifacts/${encodeArtifactName(artifactName)}/versions`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

/** POST /api/v1/artifacts — crear registro de artefacto */
export function artifactsCollectionUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/artifacts`, base.endsWith("/") ? base : `${base}/`);
}

/** GET /api/v1/artifacts/{encodedName} */
export function artifactDetailUrl(baseRegistryUrl: string, artifactName: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/artifacts/${encodeArtifactName(artifactName)}`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

/** GET /api/v1/artifacts/{encodedName}/versions/{version} — checksum + manifest sin tarball */
export function artifactVersionDetailUrl(
  baseRegistryUrl: string,
  artifactName: string,
  version: string,
): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/artifacts/${encodeArtifactName(artifactName)}/versions/${encodeURIComponent(version)}`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

export function authMeUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/auth/me`, base.endsWith("/") ? base : `${base}/`);
}

export function authDeviceCodeUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/auth/device/code`, base.endsWith("/") ? base : `${base}/`);
}

export function authDeviceTokenUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/auth/device/token`, base.endsWith("/") ? base : `${base}/`);
}

export function searchUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/search`, base.endsWith("/") ? base : `${base}/`);
}

export function validateManifestUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/validate/manifest`, base.endsWith("/") ? base : `${base}/`);
}

export function installEventsUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/install-events`, base.endsWith("/") ? base : `${base}/`);
}

export function healthUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/health`, base.endsWith("/") ? base : `${base}/`);
}

/** Query opcional para GET /api/v1/workspaces */
export type WorkspacesListQuery = {
  limit?: number;
  cursor?: string | null;
  status?: "draft" | "active" | "archived";
  q?: string;
};

export function workspacesListUrl(baseRegistryUrl: string, query?: WorkspacesListQuery): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  const u = new URL(`${API_V1_PREFIX}/workspaces`, base.endsWith("/") ? base : `${base}/`);
  if (query?.limit != null && Number.isFinite(query.limit)) {
    u.searchParams.set("limit", String(Math.floor(query.limit)));
  }
  if (query?.cursor) u.searchParams.set("cursor", query.cursor);
  if (query?.status) u.searchParams.set("status", query.status);
  const q = query?.q?.trim();
  if (q) u.searchParams.set("q", q);
  return u;
}

/** GET /api/v1/workspaces/{id} */
export function workspaceDetailUrl(baseRegistryUrl: string, workspaceId: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/workspaces/${encodeURIComponent(workspaceId)}`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

/** PATCH /api/v1/workspaces/{id} */
export function workspacePatchUrl(baseRegistryUrl: string, workspaceId: string): URL {
  return workspaceDetailUrl(baseRegistryUrl, workspaceId);
}

/** PUT /api/v1/workspaces/{id}/artifacts */
export function workspaceArtifactsPutUrl(baseRegistryUrl: string, workspaceId: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/workspaces/${encodeURIComponent(workspaceId)}/artifacts`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

/** GET /api/v1/workspaces/{id}/awf-workspace.json — cuerpo JSON AwfWorkspaceJson (no envuelto en { ok }). */
export function workspaceSnapshotUrl(baseRegistryUrl: string, workspaceId: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(
    `${API_V1_PREFIX}/workspaces/${encodeURIComponent(workspaceId)}/awf-workspace.json`,
    base.endsWith("/") ? base : `${base}/`,
  );
}

/** POST /api/v1/workspaces/match */
export function workspacesMatchUrl(baseRegistryUrl: string): URL {
  const base = normalizeRegistryUrl(baseRegistryUrl);
  return new URL(`${API_V1_PREFIX}/workspaces/match`, base.endsWith("/") ? base : `${base}/`);
}

export function normalizeRegistryUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Respuesta típica JSON error §34.2 */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ResolveOk = {
  name: string;
  version: string;
  checksumSha256: string;
  tarballUrl: string;
  /** true si la versión resuelta está marcada como deprecated (sigue siendo instalable) */
  deprecated?: boolean;
};

/** POST /api/v1/artifacts */
export type CreateArtifactRequestBody = {
  name: string;
  type: string;
  description: string;
  visibility?: "private" | "internal" | "public";
};

export type CreateArtifactOk = {
  artifact: {
    id: string;
    name: string;
    type: string;
    description: string;
    visibility?: string;
    status?: string;
    owner?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

/** GET .../versions/{version} — suficiente para diff liviano (checksum + manifest almacenado). */
export type ArtifactVersionRecord = {
  id: string;
  artifactId?: string;
  version: string;
  status?: string;
  manifest: unknown;
  changelog?: string;
  tarballUrl?: string;
  checksumSha256: string;
  sizeBytes?: number;
  createdAt?: string;
  publishedAt?: string | null;
};

export type ArtifactVersionGetOk = {
  version: ArtifactVersionRecord;
};

/** GET /api/v1/artifacts/{encodedName} — catálogo + historial de versiones */
export type ArtifactDetailOk = {
  id: string;
  name: string;
  type: string;
  description: string;
  visibility?: string;
  status?: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  versions: ArtifactVersionRecord[];
  distTags?: { tag: string; version: string }[];
};

export type MeOk = {
  user: { id: string; email: string; name: string | null; role: string; createdAt: string };
  authMethod: string;
  scopes?: string[];
  cliAccessTokenId?: string;
};

/** POST /api/v1/auth/device/code — sin autenticación. */
export type DeviceCodeOk = {
  user_code: string;
  device_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

/** POST /api/v1/auth/device/token — cuerpo { device_code }. */
export type DeviceTokenPending = { authorization_pending: true; error: "authorization_pending" };
export type DeviceTokenSlowDown = { slow_down: true; error: "slow_down" };
export type DeviceTokenSuccess = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

/** POST /api/v1/auth/change-password — sesión cookie (panel). */
export type ChangePasswordRequestBody = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordOk = { ok: true };

/** GET /api/v1/user/personal-access-tokens */
export type PatListItem = {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type ListPatOk = {
  items: PatListItem[];
  availableScopes: string[];
};

/** POST /api/v1/user/personal-access-tokens */
export type CreatePatRequestBody = {
  name: string;
  scopes: string[];
  expiresAt?: string | null;
};

export type CreatePatOk = {
  token: string;
  id: string;
  tokenPrefix: string;
  name: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  warning: string;
};

/** PATCH /api/v1/user/personal-access-tokens/:id */
export type RenamePatRequestBody = { name: string };

export type RenamePatOk = { item: PatListItem };

/** DELETE /api/v1/user/personal-access-tokens/:id */
export type RevokePatOk = { ok: true };

/** Body POST /install-events — apps/web/app/api/v1/install-events/route.ts */
export type InstallEventRequestBody = {
  artifactName: string;
  version: string;
  projectName?: string;
  workspacePathHash?: string;
  cliVersion: string;
};

/** Bloque constitucional (JSON en `Workspace.constitution`). */
export type ConstitutionSectionBlock = {
  title: string;
  body: string;
  bullets?: string[];
};

export type ConstitutionPayload = {
  identity: ConstitutionSectionBlock;
  stackContext: ConstitutionSectionBlock;
  principles: ConstitutionSectionBlock[];
  restrictions: ConstitutionSectionBlock[];
  coding: ConstitutionSectionBlock[];
  security: ConstitutionSectionBlock[];
  qualityTesting: ConstitutionSectionBlock[];
  collaboration: ConstitutionSectionBlock[];
  glossary: ConstitutionSectionBlock[];
};

export type WorkspaceArtifactRef = {
  artifactId: string;
  name: string;
  type: string;
  pinnedVersion: string | null;
  order: number;
};

export type WorkspaceListItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  semver: string;
  status: "draft" | "active" | "archived";
  stacks: string[];
  updatedAt: string;
  artifactCount: number;
  ownerId: string;
};

/** GET /api/v1/workspaces */
export type WorkspaceListOk = {
  items: WorkspaceListItem[];
  nextCursor: string | null;
};

export type WorkspaceDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  semver: string;
  status: "draft" | "active" | "archived";
  stacks: string[];
  constitution: ConstitutionPayload;
  rawMarkdown: string;
  customMarkdown: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  artifacts: WorkspaceArtifactRef[];
};

export type CreateWorkspaceRequestBody = {
  name: string;
  slug?: string;
  description?: string;
  stacks?: string[];
  constitution?: ConstitutionPayload;
  status?: "draft" | "active" | "archived";
  semver?: string;
  rawMarkdown?: string;
  customMarkdown?: boolean;
};

export type UpdateWorkspaceRequestBody = Partial<{
  name: string;
  slug: string;
  description: string;
  stacks: string[];
  constitution: ConstitutionPayload;
  status: "draft" | "active" | "archived";
  semver: string;
  rawMarkdown: string;
  customMarkdown: boolean;
}>;

export type PutWorkspaceArtifactsBody = {
  items: { artifactId: string; pinnedVersion?: string | null; order?: number }[];
};

/** Snapshot descargable (GET …/awf-workspace.json). */
export type AwfWorkspaceJson = {
  name: string;
  version: string;
  stacks: string[];
  instructionsMarkdown: string;
  artifacts: { name: string; range: string }[];
};

/** GET /api/v1/workspaces/{id} */
export type WorkspaceGetOk = {
  workspace: WorkspaceDetail;
};

/** POST /api/v1/workspaces — respuesta creación */
export type CreateWorkspaceOk = {
  workspace: WorkspaceDetail;
};

/** POST /api/v1/workspaces/match */
export type WorkspaceMatchRequestBody = {
  stacks: string[];
};

export type WorkspaceMatchItem = {
  workspaceId: string;
  slug: string;
  name: string;
  score: number;
  reasons: string[];
};

export type WorkspaceMatchOk = {
  items: WorkspaceMatchItem[];
};
