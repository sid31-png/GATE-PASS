-- CreateTable
CREATE TABLE "Partnership" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amEmployeeId" INTEGER NOT NULL,
    "operatorIds" TEXT NOT NULL,
    "flagManager" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Partnership_amEmployeeId_fkey" FOREIGN KEY ("amEmployeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssignmentRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchType" TEXT NOT NULL,
    "matchValue" TEXT NOT NULL,
    "operatorIds" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "flagManager" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "accountManagerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("contact", "createdAt", "email", "id", "name", "notes", "phone", "sector", "updatedAt") SELECT "contact", "createdAt", "email", "id", "name", "notes", "phone", "sector", "updatedAt" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE INDEX "Company_accountManagerId_idx" ON "Company"("accountManagerId");
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "isOpsAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isField" BOOLEAN NOT NULL DEFAULT false,
    "isAM" BOOLEAN NOT NULL DEFAULT false,
    "isAMLead" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("active", "createdAt", "email", "id", "isAM", "isAMLead", "isField", "isManager", "isOnline", "name", "phone", "updatedAt") SELECT "active", "createdAt", "email", "id", "isAM", "isAMLead", "isField", "isManager", "isOnline", "name", "phone", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_name_key" ON "Employee"("name");
CREATE TABLE "new_ServiceRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "companyId" INTEGER,
    "clientName" TEXT,
    "description" TEXT,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED_TO_ONLINE',
    "createdById" INTEGER NOT NULL,
    "claimedById" INTEGER,
    "claimedAt" DATETIME,
    "returnComment" TEXT,
    "deliveryTaskId" INTEGER,
    "assignmentRuleId" INTEGER,
    "partnershipId" INTEGER,
    "assignmentNote" TEXT,
    "flaggedForManager" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_deliveryTaskId_fkey" FOREIGN KEY ("deliveryTaskId") REFERENCES "DeliveryTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_assignmentRuleId_fkey" FOREIGN KEY ("assignmentRuleId") REFERENCES "AssignmentRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceRequest" ("attachments", "category", "claimedAt", "claimedById", "clientName", "companyId", "createdAt", "createdById", "deliveryTaskId", "description", "id", "returnComment", "status", "title", "updatedAt") SELECT "attachments", "category", "claimedAt", "claimedById", "clientName", "companyId", "createdAt", "createdById", "deliveryTaskId", "description", "id", "returnComment", "status", "title", "updatedAt" FROM "ServiceRequest";
DROP TABLE "ServiceRequest";
ALTER TABLE "new_ServiceRequest" RENAME TO "ServiceRequest";
CREATE UNIQUE INDEX "ServiceRequest_deliveryTaskId_key" ON "ServiceRequest"("deliveryTaskId");
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");
CREATE INDEX "ServiceRequest_createdById_idx" ON "ServiceRequest"("createdById");
CREATE INDEX "ServiceRequest_claimedById_idx" ON "ServiceRequest"("claimedById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_amEmployeeId_key" ON "Partnership"("amEmployeeId");
