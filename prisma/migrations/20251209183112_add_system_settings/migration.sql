/*
  Warnings:

  - Added the required column `updatedAt` to the `SystemSetting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "entrenadorCelular" TEXT;
ALTER TABLE "User" ADD COLUMN "entrenadorNombre" TEXT;
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" DATETIME;
ALTER TABLE "User" ADD COLUMN "sedeNombre" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "message", "read", "title", "type", "userId") SELECT "createdAt", "id", "message", "read", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemSetting" ("key", "value") SELECT "key", "value" FROM "SystemSetting";
DROP TABLE "SystemSetting";
ALTER TABLE "new_SystemSetting" RENAME TO "SystemSetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
