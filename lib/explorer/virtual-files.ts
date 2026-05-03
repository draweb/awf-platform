export type VersionSlice = {
  version: string;
  status: string;
  checksumSha256: string;
  sizeBytes: number;
  manifest: unknown;
  changelog: string;
  createdAt: string;
  publishedAt: string | null;
};

export type ArtifactSlice = {
  name: string;
  type: string;
  description: string;
  status: string;
  visibility: string;
  owner: string;
  distTags: { tag: string; version: string }[];
};

export function stringifyManifest(manifest: unknown): string {
  try {
    return JSON.stringify(manifest, null, 2);
  } catch {
    return String(manifest);
  }
}

export function buildMetaYaml(artifact: ArtifactSlice, ver: VersionSlice | null): string {
  const lines = [
    `# AWF package metadata`,
    `name: ${yamlQuote(artifact.name)}`,
    `type: ${artifact.type}`,
    `status: ${artifact.status}`,
    `visibility: ${artifact.visibility}`,
    `owner: ${yamlQuote(artifact.owner)}`,
    ``,
  ];
  if (ver) {
    lines.push(
      `version: ${yamlQuote(ver.version)}`,
      `version_status: ${ver.status}`,
      `checksum_sha256: ${yamlQuote(ver.checksumSha256)}`,
      `size_bytes: ${ver.sizeBytes}`,
      `created_at: ${yamlQuote(ver.createdAt)}`,
      `published_at: ${ver.publishedAt ? yamlQuote(ver.publishedAt) : "null"}`,
    );
  } else {
    lines.push(`version: null`, `note: "Sin versiones publicadas aún"`);
  }
  if (artifact.distTags.length) {
    lines.push(``, `dist_tags:`);
    for (const t of artifact.distTags) {
      lines.push(`  ${t.tag}: ${yamlQuote(t.version)}`);
    }
  }
  return lines.join("\n");
}

function yamlQuote(s: string): string {
  if (/[:#\n\r\t"'\\]/.test(s) || s.startsWith(" ") || s.startsWith("@")) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}
