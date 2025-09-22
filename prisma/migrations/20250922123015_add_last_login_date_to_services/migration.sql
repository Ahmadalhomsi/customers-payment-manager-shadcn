-- CreateEnum
CREATE TYPE "public"."ReminderStatus" AS ENUM ('SCHEDULED', 'SENT', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE', 'DAMAGED', 'RESERVED');

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "canViewCustomers" BOOLEAN NOT NULL DEFAULT false,
    "canEditCustomers" BOOLEAN NOT NULL DEFAULT false,
    "canViewServices" BOOLEAN NOT NULL DEFAULT false,
    "canEditServices" BOOLEAN NOT NULL DEFAULT false,
    "canViewReminders" BOOLEAN NOT NULL DEFAULT false,
    "canEditReminders" BOOLEAN NOT NULL DEFAULT false,
    "canViewAdmins" BOOLEAN NOT NULL DEFAULT false,
    "canEditAdmins" BOOLEAN NOT NULL DEFAULT false,
    "canSeePasswords" BOOLEAN NOT NULL DEFAULT false,
    "canViewPhysicalProducts" BOOLEAN NOT NULL DEFAULT false,
    "canEditPhysicalProducts" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyName" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Adisyon Programı',
    "paymentType" TEXT NOT NULL DEFAULT 'custom',
    "periodPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endingDate" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year'),
    "deviceToken" TEXT,
    "terminal" TEXT,
    "lastLoginDate" TIMESTAMP(3),
    "customerID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reminder" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."ReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
    "message" TEXT,
    "serviceID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FailedLoginAttempt" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),

    CONSTRAINT "FailedLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenewHistory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "previousEndDate" TIMESTAMP(3) NOT NULL,
    "newEndDate" TIMESTAMP(3) NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhysicalProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Bilgisayar',
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "supplier" TEXT,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT NOT NULL DEFAULT 'Yeni',
    "specifications" TEXT,
    "warranty" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "assignedTo" TEXT,
    "customerID" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalProduct_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "Admin_username_key" ON "public"."Admin"("username");

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
CREATE INDEX "Service_lastLoginDate_idx" ON "public"."Service"("lastLoginDate");

-- CreateIndex
CREATE INDEX "Service_customerID_active_idx" ON "public"."Service"("customerID", "active");

-- CreateIndex
CREATE INDEX "Service_category_active_idx" ON "public"."Service"("category", "active");

-- CreateIndex
CREATE INDEX "Service_startingDate_endingDate_idx" ON "public"."Service"("startingDate", "endingDate");

-- CreateIndex
CREATE UNIQUE INDEX "FailedLoginAttempt_ipAddress_key" ON "public"."FailedLoginAttempt"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalProduct_serialNumber_key" ON "public"."PhysicalProduct"("serialNumber");

-- CreateIndex
CREATE INDEX "PhysicalProduct_name_idx" ON "public"."PhysicalProduct"("name");

-- CreateIndex
CREATE INDEX "PhysicalProduct_category_idx" ON "public"."PhysicalProduct"("category");

-- CreateIndex
CREATE INDEX "PhysicalProduct_brand_idx" ON "public"."PhysicalProduct"("brand");

-- CreateIndex
CREATE INDEX "PhysicalProduct_status_idx" ON "public"."PhysicalProduct"("status");

-- CreateIndex
CREATE INDEX "PhysicalProduct_customerID_idx" ON "public"."PhysicalProduct"("customerID");

-- CreateIndex
CREATE INDEX "PhysicalProduct_createdAt_idx" ON "public"."PhysicalProduct"("createdAt");

-- CreateIndex
CREATE INDEX "PhysicalProduct_purchaseDate_idx" ON "public"."PhysicalProduct"("purchaseDate");

-- CreateIndex
CREATE INDEX "PhysicalProduct_category_status_idx" ON "public"."PhysicalProduct"("category", "status");

-- CreateIndex
CREATE INDEX "PhysicalProduct_status_customerID_idx" ON "public"."PhysicalProduct"("status", "customerID");

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

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_serviceID_fkey" FOREIGN KEY ("serviceID") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewHistory" ADD CONSTRAINT "RenewHistory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhysicalProduct" ADD CONSTRAINT "PhysicalProduct_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
