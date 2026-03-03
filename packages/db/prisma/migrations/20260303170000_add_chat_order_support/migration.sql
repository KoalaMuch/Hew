-- AlterEnum: Add ORDER_CARD to MessageType (run outside transaction if PG < 12)
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'ORDER_CARD';

-- AlterTable: Make offerId optional, add roomId, orderName, orderImageUrl to Order
ALTER TABLE "Order" ALTER COLUMN "offerId" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "roomId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderImageUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_roomId_key" ON "Order"("roomId");
CREATE INDEX IF NOT EXISTS "Order_roomId_idx" ON "Order"("roomId");

-- AddForeignKey (roomId -> ChatRoom)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Order_roomId_fkey'
  ) THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
