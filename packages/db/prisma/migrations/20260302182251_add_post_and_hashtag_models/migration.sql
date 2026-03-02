-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('RUBHEW', 'HAKHONG');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DELETED');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "PostType" NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "imageUrls" TEXT[],
    "tripId" TEXT,
    "itemRequestId" TEXT,
    "country" TEXT,
    "city" TEXT,
    "travelDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "status" "PostStatus" NOT NULL DEFAULT 'ACTIVE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostHashtag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_tripId_key" ON "Post"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_itemRequestId_key" ON "Post"("itemRequestId");

-- CreateIndex
CREATE INDEX "Post_type_status_idx" ON "Post"("type", "status");

-- CreateIndex
CREATE INDEX "Post_sessionId_idx" ON "Post"("sessionId");

-- CreateIndex
CREATE INDEX "Post_country_idx" ON "Post"("country");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PostHashtag_name_key" ON "PostHashtag"("name");

-- CreateIndex
CREATE INDEX "PostHashtag_count_idx" ON "PostHashtag"("count" DESC);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_itemRequestId_fkey" FOREIGN KEY ("itemRequestId") REFERENCES "ItemRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
