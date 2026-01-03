-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "url" TEXT,
    "location" TEXT,
    "method" TEXT,
    "payerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "distributionUFLP" TEXT NOT NULL DEFAULT 'PENDING',
    "distributionECOA" TEXT NOT NULL DEFAULT 'PENDING',
    "distributionCommission" TEXT NOT NULL DEFAULT 'PENDING',
    "distributionCommissionDate" DATETIME,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "date", "id", "location", "method", "payerName", "rejectionReason", "status", "updatedAt", "url", "userId") SELECT "amount", "createdAt", "date", "id", "location", "method", "payerName", "rejectionReason", "status", "updatedAt", "url", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
