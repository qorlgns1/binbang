-- Drop Sprint 1 Mooncatch tables (apps/mooncatch removed in Sprint 3)
-- Dependency order: notifications → alert_events, room_snapshots → poll_runs → watches, consent_logs

DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "alert_events";
DROP TABLE IF EXISTS "room_snapshots";
DROP TABLE IF EXISTS "poll_runs";
DROP TABLE IF EXISTS "watches";
DROP TABLE IF EXISTS "consent_logs";
