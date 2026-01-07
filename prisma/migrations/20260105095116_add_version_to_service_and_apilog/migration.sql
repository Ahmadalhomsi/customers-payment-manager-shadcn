-- AlterTable
ALTER TABLE "ApiLog" ADD COLUMN     "version" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "version" TEXT,
ALTER COLUMN "endingDate" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year');
