-- CreateEnum
CREATE TYPE "CliDeviceAuthStatus" AS ENUM ('pending', 'approved', 'consumed');

-- CreateTable
CREATE TABLE "cli_access_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'CLI device login',
    "token_prefix" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_device_authorizations" (
    "id" TEXT NOT NULL,
    "user_code_hash" TEXT NOT NULL,
    "device_code_hash" TEXT NOT NULL,
    "status" "CliDeviceAuthStatus" NOT NULL DEFAULT 'pending',
    "user_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "cli_access_token_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_device_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cli_access_tokens_token_hash_key" ON "cli_access_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "cli_access_tokens_user_id_idx" ON "cli_access_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cli_device_authorizations_user_code_hash_key" ON "cli_device_authorizations"("user_code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "cli_device_authorizations_device_code_hash_key" ON "cli_device_authorizations"("device_code_hash");

-- CreateIndex
CREATE INDEX "cli_device_authorizations_expires_at_idx" ON "cli_device_authorizations"("expires_at");

-- AddForeignKey
ALTER TABLE "cli_access_tokens" ADD CONSTRAINT "cli_access_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_device_authorizations" ADD CONSTRAINT "cli_device_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_device_authorizations" ADD CONSTRAINT "cli_device_authorizations_cli_access_token_id_fkey" FOREIGN KEY ("cli_access_token_id") REFERENCES "cli_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
