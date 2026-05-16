-- DropIndex
DROP INDEX "Booking_roomId_idx";

-- DropIndex
DROP INDEX "Booking_userId_idx";

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "Booking_userId_checkIn_idx" ON "Booking"("userId", "checkIn" DESC);
