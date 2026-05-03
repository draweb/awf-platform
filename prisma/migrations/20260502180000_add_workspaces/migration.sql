-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "semver" TEXT NOT NULL DEFAULT '0.1.0',
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'draft',
    "constitution" JSONB NOT NULL,
    "raw_markdown" TEXT NOT NULL,
    "stacks" TEXT[],
    "custom_markdown" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_artifacts" (
    "workspace_id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "pinned_version" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "workspace_artifacts_pkey" PRIMARY KEY ("workspace_id","artifact_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_owner_id_idx" ON "workspaces"("owner_id");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_artifacts" ADD CONSTRAINT "workspace_artifacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_artifacts" ADD CONSTRAINT "workspace_artifacts_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
