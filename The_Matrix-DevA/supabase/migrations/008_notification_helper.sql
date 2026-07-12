-- ============================================
-- AssetFlow Database Migration: Notification Helper
-- ============================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_ref_id UUID DEFAULT NULL,
  p_ref_type TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (p_user_id, p_type, p_title, p_message, p_ref_id, p_ref_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
