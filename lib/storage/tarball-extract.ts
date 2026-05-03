import { gunzipSync } from "node:zlib";
import { readTarballBytes } from "./tarball";

export type TarballFileEntry = {
  path: string;
  content: string;
  size: number;
};

const MAX_FILE_SIZE = 512 * 1024;
const MAX_TOTAL = 2 * 1024 * 1024;
const BLOCK = 512;

/**
 * Minimal tar parser — extracts text files from a gzipped tarball,
 * stripping the leading `package/` directory.
 * Uses only Node.js built-ins (no `tar` dependency needed in apps/web).
 */
export async function extractTarballFiles(tarballUrl: string): Promise<TarballFileEntry[]> {
  const gzBuf = await readTarballBytes(tarballUrl);
  const data = gunzipSync(gzBuf);

  const entries: TarballFileEntry[] = [];
  let totalSize = 0;
  let offset = 0;

  while (offset + BLOCK <= data.length) {
    const header = data.subarray(offset, offset + BLOCK);
    if (header.every((b) => b === 0)) break;

    const nameRaw = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const sizeOctal = header.subarray(124, 136).toString("utf8").replace(/\0.*$/, "").trim();
    const typeFlag = header[156];
    const fileSize = parseInt(sizeOctal, 8) || 0;

    offset += BLOCK;

    const isFile = typeFlag === 0 || typeFlag === 0x30; // '0' or NUL
    const blocks = Math.ceil(fileSize / BLOCK);
    const contentEnd = offset + fileSize;

    if (isFile && fileSize > 0 && fileSize <= MAX_FILE_SIZE && totalSize + fileSize <= MAX_TOTAL) {
      let cleanPath = nameRaw;
      if (cleanPath.startsWith("package/")) {
        cleanPath = cleanPath.slice("package/".length);
      }

      if (cleanPath && cleanPath !== "awf.asset.json") {
        const content = data.subarray(offset, contentEnd).toString("utf8");
        if (!isBinary(content)) {
          entries.push({ path: cleanPath, content, size: fileSize });
          totalSize += fileSize;
        }
      }
    }

    offset += blocks * BLOCK;
  }

  return entries;
}

function isBinary(s: string): boolean {
  for (let i = 0; i < Math.min(s.length, 1024); i++) {
    if (s.charCodeAt(i) === 0) return true;
  }
  return false;
}
