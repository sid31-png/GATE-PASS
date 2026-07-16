-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isField" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DeliveryTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gatePassId" INTEGER,
    "companyId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'ONLINE',
    "createdById" INTEGER,
    "assignedToId" INTEGER,
    "assignedById" INTEGER,
    "scheduledAt" DATETIME,
    "instructions" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "blockedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryTask_gatePassId_fkey" FOREIGN KEY ("gatePassId") REFERENCES "GatePass" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeliveryTask_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_name_key" ON "Employee"("name");

-- CreateIndex
CREATE INDEX "DeliveryTask_stage_idx" ON "DeliveryTask"("stage");

-- CreateIndex
CREATE INDEX "DeliveryTask_assignedToId_idx" ON "DeliveryTask"("assignedToId");

-- CreateIndex
CREATE INDEX "DeliveryTask_gatePassId_idx" ON "DeliveryTask"("gatePassId");
