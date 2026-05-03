import { createHash, randomBytes } from "node:crypto";
import type { CliAccessToken, Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/db";

const CLI_TOKEN_DAYS = 90;

export function hashCliToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function findCliTokenByRaw(
  raw: string,
): Promise<(CliAccessToken & { user: User }) | null> {
  if (!raw.startsWith("awf_cli_")) return null;
  const tokenHash = hashCliToken(raw);
  return prisma.cliAccessToken.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
}

export async function touchCliTokenUsed(id: string): Promise<void> {
  await prisma.cliAccessToken.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}

export async function createCliAccessTokenForUser(userId: string): Promise<{ rawToken: string; record: CliAccessToken }> {
  const rawToken = `awf_cli_${randomBytes(32).toString("base64url")}`;
  const tokenPrefix = rawToken.slice(0, 14);
  const tokenHash = hashCliToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CLI_TOKEN_DAYS);
  const record = await prisma.cliAccessToken.create({
    data: {
      userId,
      name: "CLI device login",
      tokenPrefix,
      tokenHash,
      expiresAt,
    },
  });
  return { rawToken, record };
}

export async function createCliAccessTokenForUserTx(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<{ rawToken: string; record: CliAccessToken }> {
  const rawToken = `awf_cli_${randomBytes(32).toString("base64url")}`;
  const tokenPrefix = rawToken.slice(0, 14);
  const tokenHash = hashCliToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CLI_TOKEN_DAYS);
  const record = await tx.cliAccessToken.create({
    data: {
      userId,
      name: "CLI device login",
      tokenPrefix,
      tokenHash,
      expiresAt,
    },
  });
  return { rawToken, record };
}
