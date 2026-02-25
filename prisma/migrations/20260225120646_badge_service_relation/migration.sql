-- AlterTable
ALTER TABLE "Notifications" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "serviceId" TEXT;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "endingDate" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year');
