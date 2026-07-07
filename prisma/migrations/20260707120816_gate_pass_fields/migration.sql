-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Collector" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GatePass" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "gatePassType" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "passCategory" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submissionAt" DATETIME NOT NULL,
    "collectorId" INTEGER,
    "collectionAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GatePass_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GatePass_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Collector_name_key" ON "Collector"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GatePass_number_key" ON "GatePass"("number");

-- CreateIndex
CREATE INDEX "GatePass_status_idx" ON "GatePass"("status");

-- CreateIndex
CREATE INDEX "GatePass_companyId_idx" ON "GatePass"("companyId");

-- CreateIndex
CREATE INDEX "GatePass_collectorId_idx" ON "GatePass"("collectorId");

-- CreateIndex
CREATE INDEX "GatePass_location_idx" ON "GatePass"("location");
