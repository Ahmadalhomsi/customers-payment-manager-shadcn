-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Patron Uygulaması',
ALTER COLUMN "endingDate" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year');
