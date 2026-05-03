import { z } from "zod";
import semver from "semver";

/** Preflight schema for awf.asset.json — alinear con docs/requeriments.md §6 */
const installFileSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  merge: z.boolean().optional(),
});

const semverVersion = z
  .string()
  .min(1)
  .refine((v) => semver.valid(v) !== null, { message: "version debe ser SemVer válido" });

export const awfAssetManifestSchema = z.object({
  name: z.string().min(1),
  version: semverVersion,
  type: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  stacks: z.array(z.string()).optional(),
  engines: z.record(z.string(), z.string()).optional(),
  dependencies: z.record(z.string(), z.string()).optional(),
  install: z
    .object({
      target: z.string().optional(),
      strategy: z.string().optional(),
      files: z.array(installFileSchema),
    })
    .optional(),
  scripts: z
    .object({
      postinstall: z.string().optional(),
      validate: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  license: z.string().optional(),
  private: z.boolean().optional(),
});

export type AwfAssetManifest = z.infer<typeof awfAssetManifestSchema>;

export function parseAwfAssetManifest(data: unknown): AwfAssetManifest {
  return awfAssetManifestSchema.parse(data);
}

export function safeParseAwfAssetManifest(data: unknown) {
  return awfAssetManifestSchema.safeParse(data);
}
