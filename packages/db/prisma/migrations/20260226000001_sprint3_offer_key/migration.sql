-- AlterTable
ALTER TABLE "agoda_alert_events" ADD COLUMN "offerKey" TEXT;

-- CreateIndex
CREATE INDEX "agoda_alert_events_accommodationId_type_offerKey_detectedAt_idx" ON "agoda_alert_events"("accommodationId", "type", "offerKey", "detectedAt");
