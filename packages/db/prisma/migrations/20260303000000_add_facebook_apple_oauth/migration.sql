-- AlterTable
ALTER TABLE "RegisteredUser" ADD COLUMN "facebookId" TEXT,
ADD COLUMN "appleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredUser_facebookId_key" ON "RegisteredUser"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredUser_appleId_key" ON "RegisteredUser"("appleId");
