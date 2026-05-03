-- CreateTable
CREATE TABLE "artifact_libraries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifact_libraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_artifacts" (
    "library_id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "pinned_version" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "library_artifacts_pkey" PRIMARY KEY ("library_id","artifact_id")
);

-- CreateTable
CREATE TABLE "workspace_libraries" (
    "workspace_id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "workspace_libraries_pkey" PRIMARY KEY ("workspace_id","library_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artifact_libraries_slug_key" ON "artifact_libraries"("slug");

-- CreateIndex
CREATE INDEX "artifact_libraries_owner_id_idx" ON "artifact_libraries"("owner_id");

-- AddForeignKey
ALTER TABLE "artifact_libraries" ADD CONSTRAINT "artifact_libraries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_artifacts" ADD CONSTRAINT "library_artifacts_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "artifact_libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_artifacts" ADD CONSTRAINT "library_artifacts_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_libraries" ADD CONSTRAINT "workspace_libraries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_libraries" ADD CONSTRAINT "workspace_libraries_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "artifact_libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
