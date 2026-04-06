/*
  Warnings:

  - You are about to drop the column `foursquare_score` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `foursquare_match_confidence` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `foursquare_popularity` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `foursquare_rating` on the `Business` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "pagespeed_score" REAL,
    "yelp_score" REAL,
    "breakdown_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Analysis" ("breakdown_json", "businessId", "created_at", "id", "pagespeed_score", "yelp_score") SELECT "breakdown_json", "businessId", "created_at", "id", "pagespeed_score", "yelp_score" FROM "Analysis";
DROP TABLE "Analysis";
ALTER TABLE "new_Analysis" RENAME TO "Analysis";
CREATE INDEX "Analysis_businessId_idx" ON "Analysis"("businessId");
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "categories" TEXT NOT NULL,
    "google_rating" REAL,
    "google_review_count" INTEGER,
    "yelp_rating" REAL,
    "yelp_review_count" INTEGER,
    "yelp_match_confidence" REAL,
    "final_score" REAL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "last_scanned" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Business" ("address", "categories", "checked", "createdAt", "final_score", "google_rating", "google_review_count", "id", "last_scanned", "name", "phone", "place_id", "updatedAt", "website", "yelp_match_confidence", "yelp_rating", "yelp_review_count") SELECT "address", "categories", "checked", "createdAt", "final_score", "google_rating", "google_review_count", "id", "last_scanned", "name", "phone", "place_id", "updatedAt", "website", "yelp_match_confidence", "yelp_rating", "yelp_review_count" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_place_id_key" ON "Business"("place_id");
CREATE INDEX "Business_place_id_idx" ON "Business"("place_id");
CREATE INDEX "Business_final_score_idx" ON "Business"("final_score");
CREATE INDEX "Business_checked_idx" ON "Business"("checked");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
