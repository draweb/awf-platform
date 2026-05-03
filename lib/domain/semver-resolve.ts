import semver from "semver";

/**
 * Elige la versión publicada más alta que satisface el rango (o null).
 */
export function maxSatisfying(
  publishedVersions: string[],
  range: string,
): string | null {
  const valid = publishedVersions.filter((v) => semver.valid(v));
  return semver.maxSatisfying(valid, range, { includePrerelease: true });
}
