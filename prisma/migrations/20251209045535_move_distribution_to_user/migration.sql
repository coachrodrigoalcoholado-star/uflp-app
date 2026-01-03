-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "firstName" TEXT,
    "lastNamePaterno" TEXT,
    "lastNameMaterno" TEXT,
    "dob" DATETIME,
    "sex" TEXT,
    "age" INTEGER,
    "birthPlace" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "landline" TEXT,
    "alternativeEmail" TEXT,
    "profession" TEXT,
    "educationLevel" TEXT,
    "institution" TEXT,
    "currentOccupation" TEXT,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "documentsCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cohortId" TEXT,
    "distributionUFLP" TEXT NOT NULL DEFAULT 'PENDING',
    "distributionUFLPDate" DATETIME,
    "distributionECOA" TEXT NOT NULL DEFAULT 'PENDING',
    "distributionECOADate" DATETIME,
    "distributionCommission" TEXT NOT NULL DEFAULT 'PENDING',
    "distributionCommissionDate" DATETIME,
    CONSTRAINT "User_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("address", "age", "alternativeEmail", "birthPlace", "city", "cohortId", "country", "createdAt", "currentOccupation", "dob", "documentsCompleted", "educationLevel", "email", "firstName", "id", "institution", "landline", "lastNameMaterno", "lastNamePaterno", "password", "phone", "profession", "profileCompleted", "role", "sex", "state", "updatedAt", "zipCode") SELECT "address", "age", "alternativeEmail", "birthPlace", "city", "cohortId", "country", "createdAt", "currentOccupation", "dob", "documentsCompleted", "educationLevel", "email", "firstName", "id", "institution", "landline", "lastNameMaterno", "lastNamePaterno", "password", "phone", "profession", "profileCompleted", "role", "sex", "state", "updatedAt", "zipCode" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
