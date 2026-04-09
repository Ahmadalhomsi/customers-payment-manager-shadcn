-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ALTER COLUMN "endingDate" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year');

-- CreateIndex
CREATE INDEX "Service_archived_idx" ON "Service"("archived");

-- CreateIndex
CREATE INDEX "Service_archivedAt_idx" ON "Service"("archivedAt");
