import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { PersonalAccessToken, User } from "@prisma/client";

export function hashPatToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function findPatByRawToken(
  raw: string,
): Promise<(PersonalAccessToken & { user: User }) | null> {
  const tokenHash = hashPatToken(raw);
  return prisma.personalAccessToken.findFirst({
    where: {
      tokenHash,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { user: true },
  });
}

export async function touchPatUsed(id: string): Promise<void> {
  await prisma.personalAccessToken.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}

export async function createPersonalAccessToken(input: {
  userId: string;
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
}): Promise<{ rawToken: string; record: PersonalAccessToken }> {
  const rawToken = `awf_pat_${randomBytes(32).toString("base64url")}`;
  const tokenPrefix = rawToken.slice(0, 14);
  const tokenHash = hashPatToken(rawToken);
  const record = await prisma.personalAccessToken.create({
    data: {
      userId: input.userId,
      name: input.name,
      tokenPrefix,
      tokenHash,
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
    },
  });
  return { rawToken, record };
}
