-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "terminal" TEXT,
ALTER COLUMN "endingDate" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year'),
ALTER COLUMN "category" SET DEFAULT 'Adisyon Programı';

-- CreateTable
CREATE TABLE "public"."ApiLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "requestBody" TEXT,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" TEXT,
    "serviceName" TEXT,
    "deviceToken" TEXT,
    "validationType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiLog_createdAt_idx" ON "public"."ApiLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiLog_ipAddress_idx" ON "public"."ApiLog"("ipAddress");

-- CreateIndex
CREATE INDEX "ApiLog_serviceName_idx" ON "public"."ApiLog"("serviceName");

-- CreateIndex
CREATE INDEX "ApiLog_validationType_idx" ON "public"."ApiLog"("validationType");

-- CreateIndex
CREATE INDEX "ApiLog_responseStatus_idx" ON "public"."ApiLog"("responseStatus");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "public"."Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "public"."Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "public"."Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_createdAt_idx" ON "public"."Customer"("createdAt");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "public"."Service"("name");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "public"."Service"("category");

-- CreateIndex
CREATE INDEX "Service_companyName_idx" ON "public"."Service"("companyName");

-- CreateIndex
CREATE INDEX "Service_customerID_idx" ON "public"."Service"("customerID");

-- CreateIndex
CREATE INDEX "Service_active_idx" ON "public"."Service"("active");

-- CreateIndex
CREATE INDEX "Service_startingDate_idx" ON "public"."Service"("startingDate");

-- CreateIndex
CREATE INDEX "Service_endingDate_idx" ON "public"."Service"("endingDate");

-- CreateIndex
CREATE INDEX "Service_createdAt_idx" ON "public"."Service"("createdAt");

-- CreateIndex
CREATE INDEX "Service_paymentType_idx" ON "public"."Service"("paymentType");

-- CreateIndex
CREATE INDEX "Service_customerID_active_idx" ON "public"."Service"("customerID", "active");

-- CreateIndex
CREATE INDEX "Service_category_active_idx" ON "public"."Service"("category", "active");

-- CreateIndex
CREATE INDEX "Service_startingDate_endingDate_idx" ON "public"."Service"("startingDate", "endingDate");
