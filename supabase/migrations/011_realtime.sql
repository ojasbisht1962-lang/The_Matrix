-- ============================================
-- AssetFlow Database Migration: Realtime Publication
-- v1.1 Patch 3 — 5 tables for Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE assets;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE transfer_requests;
