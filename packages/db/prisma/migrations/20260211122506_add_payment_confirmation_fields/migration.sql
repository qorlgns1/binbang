-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "paymentConfirmedBy" TEXT;
