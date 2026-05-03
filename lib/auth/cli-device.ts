import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createCliAccessTokenForUserTx } from "./cli-token";

const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeUserCode(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function hashUserCode(input: string): string {
  const n = normalizeUserCode(input);
  return createHash("sha256").update(`awf_user_code:${n}`, "utf8").digest("hex");
}

export function hashDeviceCode(deviceCode: string): string {
  return createHash("sha256").update(`awf_device_code:${deviceCode}`, "utf8").digest("hex");
}

export function generateUserCode(): string {
  const chars = USER_CODE_ALPHABET;
  const pick = () => chars[randomBytes(1)[0]! % chars.length]!;
  let a = "";
  for (let i = 0; i < 4; i++) a += pick();
  let b = "";
  for (let i = 0; i < 4; i++) b += pick();
  return `${a}-${b}`;
}

export function generateDeviceCode(): string {
  return randomBytes(32).toString("base64url");
}

export async function createPendingDeviceAuthorization(ttlMs: number): Promise<{
  id: string;
  userCode: string;
  deviceCode: string;
  expiresAt: Date;
}> {
  const expiresAt = new Date(Date.now() + ttlMs);
  for (let attempt = 0; attempt < 12; attempt++) {
    const userCode = generateUserCode();
    const deviceCode = generateDeviceCode();
    const userCodeHash = hashUserCode(userCode);
    const deviceCodeHash = hashDeviceCode(deviceCode);
    try {
      const row = await prisma.cliDeviceAuthorization.create({
        data: {
          userCodeHash,
          deviceCodeHash,
          status: "pending",
          expiresAt,
        },
      });
      return { id: row.id, userCode, deviceCode, expiresAt };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("No se pudo crear la solicitud de dispositivo");
}

export async function approveDeviceAuthorizationByUserCode(
  userCodeInput: string,
  userId: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: "not_found" | "expired" }> {
  const h = hashUserCode(userCodeInput);
  const row = await prisma.cliDeviceAuthorization.findFirst({
    where: { userCodeHash: h, status: "pending", expiresAt: { gt: new Date() } },
  });
  if (!row) {
    const any = await prisma.cliDeviceAuthorization.findFirst({ where: { userCodeHash: h } });
    if (any && any.expiresAt <= new Date()) return { ok: false, reason: "expired" };
    return { ok: false, reason: "not_found" };
  }
  await prisma.cliDeviceAuthorization.update({
    where: { id: row.id },
    data: { status: "approved", userId, approvedAt: new Date() },
  });
  return { ok: true, id: row.id };
}

export type ExchangeDeviceResult =
  | { type: "pending" }
  | { type: "invalid" }
  | { type: "success"; access_token: string; expires_in: number; tokenId: string; userId: string };

export async function exchangeDeviceAuthorization(deviceCode: string): Promise<ExchangeDeviceResult> {
  const dch = hashDeviceCode(deviceCode);
  const row = await prisma.cliDeviceAuthorization.findFirst({
    where: { deviceCodeHash: dch },
  });
  if (!row) return { type: "invalid" };
  if (row.expiresAt <= new Date()) return { type: "invalid" };
  if (row.status === "consumed") return { type: "invalid" };
  if (row.status === "pending") return { type: "pending" };
  if (row.status !== "approved" || !row.userId) return { type: "invalid" };

  return prisma.$transaction(async (tx) => {
    const locked = await tx.cliDeviceAuthorization.updateMany({
      where: { id: row.id, status: "approved" },
      data: { status: "consumed", consumedAt: new Date() },
    });
    if (locked.count === 0) {
      const again = await tx.cliDeviceAuthorization.findFirst({ where: { id: row.id } });
      if (again?.status === "consumed") return { type: "invalid" };
      return { type: "pending" };
    }
    const { rawToken, record } = await createCliAccessTokenForUserTx(tx, row.userId);
    await tx.cliDeviceAuthorization.update({
      where: { id: row.id },
      data: { cliAccessTokenId: record.id },
    });
    const expires_in = Math.max(0, Math.floor((record.expiresAt.getTime() - Date.now()) / 1000));
    return {
      type: "success",
      access_token: rawToken,
      expires_in,
      tokenId: record.id,
      userId: row.userId,
    };
  });
}
