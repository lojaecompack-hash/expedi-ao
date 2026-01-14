DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ModulePermission') THEN
    CREATE TYPE "ModulePermission" AS ENUM ('ADMIN', 'SETTINGS', 'EXPEDICAO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Workspace" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_name_key" ON "Workspace"("name");

CREATE TABLE IF NOT EXISTS "Membership" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT,
  "permissions" "ModulePermission"[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Membership_workspaceId_userId_key" ON "Membership"("workspaceId", "userId");
CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Membership_workspaceId_fkey'
  ) THEN
    ALTER TABLE "Membership"
      ADD CONSTRAINT "Membership_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
