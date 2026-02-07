-- AlterTable
ALTER TABLE "CheckLog" ADD COLUMN     "checkIn" TIMESTAMP(3),
ADD COLUMN     "checkOut" TIMESTAMP(3),
ADD COLUMN     "pricePerNight" INTEGER;

-- CreateIndex
CREATE INDEX "CheckLog_accommodationId_checkIn_checkOut_idx" ON "CheckLog"("accommodationId", "checkIn", "checkOut");
