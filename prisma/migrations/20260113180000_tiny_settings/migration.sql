CREATE TABLE IF NOT EXISTS "TinySettings" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "clientSecretEncrypted" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TinySettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TinySettings_workspaceId_key" ON "TinySettings"("workspaceId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TinySettings_workspaceId_fkey'
  ) THEN
    ALTER TABLE "TinySettings"
      ADD CONSTRAINT "TinySettings_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
