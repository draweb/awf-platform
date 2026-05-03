const MIN_Q = 2;

export type ArtifactListQueryInput = {
  debouncedQ: string;
  type: string;
  status: string;
  visibility: string;
  limit: number;
  cursor?: string | null;
};

export function buildArtifactListSearchParams(input: ArtifactListQueryInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("limit", String(Math.min(Math.max(input.limit, 1), 100)));
  const q = input.debouncedQ.trim();
  if (q.length >= MIN_Q) params.set("q", q);
  const type = input.type.trim();
  if (type) params.set("type", type);
  const status = input.status.trim();
  if (status) params.set("status", status);
  const visibility = input.visibility.trim();
  if (visibility) params.set("visibility", visibility);
  if (input.cursor) params.set("cursor", input.cursor);
  return params;
}
