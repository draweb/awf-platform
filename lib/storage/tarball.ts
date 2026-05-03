import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import { env } from "@/lib/env";

export function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Persiste tarball: Vercel Blob si hay token; si no, disco local bajo `.data/blob/`.
 */
export async function storeTarball(key: string, data: Buffer): Promise<{ url: string; sizeBytes: number }> {
  const e = env();
  const sizeBytes = data.length;
  const safe = sanitizeKey(key);
  if (e.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(safe, data, {
      access: "public",
      token: e.BLOB_READ_WRITE_TOKEN,
      contentType: "application/gzip",
    });
    return { url: blob.url, sizeBytes };
  }
  const dir = join(process.cwd(), ".data", "blob");
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, safe);
  await writeFile(filePath, data);
  return { url: `local://${safe}`, sizeBytes };
}

export function isLocalTarballUrl(url: string): boolean {
  return url.startsWith("local://");
}

export function localPathFromTarballUrl(url: string): string {
  const key = url.replace(/^local:\/\//, "");
  return join(process.cwd(), ".data", "blob", key);
}

export async function readTarballBytes(url: string): Promise<Buffer> {
  if (isLocalTarballUrl(url)) {
    return readFile(localPathFromTarballUrl(url));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo leer tarball remoto: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
