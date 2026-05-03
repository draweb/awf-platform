import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import { hashPassword, verifyPassword } from "./password";
import { validateNewPasswordRules } from "./password-policy";

export async function changePasswordForSessionUser(params: {
  userId: string;
  keepSessionId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const msg = validateNewPasswordRules(params.newPassword, params.currentPassword);
  if (msg) {
    throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: msg });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { passwordHash: true },
  });
  if (!user) {
    throw new ApiError({ code: "NOT_FOUND", httpStatus: 404, message: "Usuario no encontrado" });
  }

  const ok = await verifyPassword(params.currentPassword, user.passwordHash);
  if (!ok) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      httpStatus: 401,
      message: "La contraseña actual no es correcta.",
    });
  }

  const passwordHash = await hashPassword(params.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: params.userId },
      data: { passwordHash },
    });
    await tx.session.deleteMany({
      where: {
        userId: params.userId,
        NOT: { id: params.keepSessionId },
      },
    });
  });
}
