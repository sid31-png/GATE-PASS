-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "serviceType" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isCEO" BOOLEAN NOT NULL DEFAULT false,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "isOpsAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isField" BOOLEAN NOT NULL DEFAULT false,
    "isAM" BOOLEAN NOT NULL DEFAULT false,
    "isAMLead" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("active", "createdAt", "email", "id", "isAM", "isAMLead", "isField", "isManager", "isOnline", "isOpsAdmin", "name", "phone", "updatedAt") SELECT "active", "createdAt", "email", "id", "isAM", "isAMLead", "isField", "isManager", "isOnline", "isOpsAdmin", "name", "phone", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_name_key" ON "Employee"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
