import { PrismaClient, UserRole, ArtifactType, ArtifactVisibility, ArtifactStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedInitRegistryBundles } from "../lib/seed/seed-init-registry-bundles";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@localhost.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin-dev-change-me";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: "Admin local",
      role: UserRole.admin,
    },
    update: {
      passwordHash,
      role: UserRole.admin,
    },
  });

  const devEmail = process.env.SEED_DEV_EMAIL ?? "dev@draweb.cloud";
  const devPassword = process.env.SEED_DEV_PASSWORD;
  if (devPassword && devPassword.length > 0) {
    const devHash = await bcrypt.hash(devPassword, 12);
    await prisma.user.upsert({
      where: { email: devEmail },
      create: {
        email: devEmail,
        passwordHash: devHash,
        name: "Dev draweb",
        role: UserRole.admin,
      },
      update: {
        passwordHash: devHash,
        role: UserRole.admin,
      },
    });
    console.log(`Seed OK: usuario admin adicional ${devEmail}`);
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email } });

  const demo = await prisma.artifact.findFirst({ where: { name: "@awf/demo-cursor-rule" } });
  if (!demo) {
    await prisma.artifact.create({
      data: {
        name: "@awf/demo-cursor-rule",
        type: ArtifactType.cursor_rule,
        description: "Paquete de ejemplo para desarrollo local",
        owner: admin.id,
        visibility: ArtifactVisibility.internal,
        status: ArtifactStatus.active,
      },
    });
  }

  await seedInitRegistryBundles(prisma, admin.id);

  console.log(`Seed OK: usuario admin ${email} (password por defecto en dev, ver seed o SEED_ADMIN_PASSWORD)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
