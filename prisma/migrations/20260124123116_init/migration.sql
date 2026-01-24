-- CreateTable
CREATE TABLE "Business" (
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
    "foursquare_rating" REAL,
    "foursquare_popularity" REAL,
    "foursquare_match_confidence" REAL,
    "final_score" REAL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "last_scanned" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "pagespeed_score" REAL,
    "yelp_score" REAL,
    "foursquare_score" REAL,
    "breakdown_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SourceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "raw_data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceSnapshot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_place_id_key" ON "Business"("place_id");

-- CreateIndex
CREATE INDEX "Business_place_id_idx" ON "Business"("place_id");

-- CreateIndex
CREATE INDEX "Business_final_score_idx" ON "Business"("final_score");

-- CreateIndex
CREATE INDEX "Business_checked_idx" ON "Business"("checked");

-- CreateIndex
CREATE INDEX "Analysis_businessId_idx" ON "Analysis"("businessId");

-- CreateIndex
CREATE INDEX "SourceSnapshot_businessId_idx" ON "SourceSnapshot"("businessId");

-- CreateIndex
CREATE INDEX "SourceSnapshot_provider_idx" ON "SourceSnapshot"("provider");
