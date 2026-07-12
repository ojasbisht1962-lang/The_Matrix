-- ============================================
-- AssetFlow Database Migration: Analytics Functions
-- For Developer D's Reports & Analytics page
-- ============================================

CREATE OR REPLACE FUNCTION get_utilization_by_department()
RETURNS TABLE(department_name TEXT, available BIGINT, allocated BIGINT, maintenance BIGINT) AS $$
  SELECT d.name,
    COUNT(*) FILTER (WHERE a.status = 'available'),
    COUNT(*) FILTER (WHERE a.status = 'allocated'),
    COUNT(*) FILTER (WHERE a.status = 'under_maintenance')
  FROM assets a
  JOIN departments d ON d.id = a.department_id
  GROUP BY d.name ORDER BY d.name;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_maintenance_frequency(group_by TEXT DEFAULT 'category')
RETURNS TABLE(group_name TEXT, request_count BIGINT) AS $$
BEGIN
  IF group_by = 'category' THEN
    RETURN QUERY
      SELECT c.name, COUNT(*)
      FROM maintenance_requests mr
      JOIN assets a ON a.id = mr.asset_id
      JOIN asset_categories c ON c.id = a.category_id
      GROUP BY c.name ORDER BY COUNT(*) DESC;
  ELSE
    RETURN QUERY
      SELECT a.name, COUNT(*)
      FROM maintenance_requests mr
      JOIN assets a ON a.id = mr.asset_id
      GROUP BY a.name ORDER BY COUNT(*) DESC LIMIT 20;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_most_used_assets(result_limit INT DEFAULT 10)
RETURNS TABLE(asset_tag TEXT, asset_name TEXT, booking_count BIGINT) AS $$
  SELECT a.asset_tag, a.name, COUNT(b.id)
  FROM bookings b
  JOIN assets a ON a.id = b.asset_id
  WHERE b.status != 'cancelled'
  GROUP BY a.asset_tag, a.name
  ORDER BY COUNT(b.id) DESC LIMIT result_limit;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_idle_assets(days INT DEFAULT 30)
RETURNS TABLE(asset_tag TEXT, asset_name TEXT, category TEXT, last_activity TIMESTAMPTZ) AS $$
  SELECT a.asset_tag, a.name, c.name,
    GREATEST(
      (SELECT MAX(al.allocated_at) FROM allocations al WHERE al.asset_id = a.id),
      (SELECT MAX(b.start_time) FROM bookings b WHERE b.asset_id = a.id)
    ) AS last_activity
  FROM assets a
  JOIN asset_categories c ON c.id = a.category_id
  WHERE a.status = 'available'
    AND NOT EXISTS (
      SELECT 1 FROM allocations al WHERE al.asset_id = a.id AND al.allocated_at > now() - (days || ' days')::interval
    )
    AND NOT EXISTS (
      SELECT 1 FROM bookings b WHERE b.asset_id = a.id AND b.start_time > now() - (days || ' days')::interval
    )
  ORDER BY last_activity ASC NULLS FIRST;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_booking_heatmap()
RETURNS TABLE(day_of_week INT, hour_of_day INT, booking_count BIGINT) AS $$
  SELECT EXTRACT(DOW FROM start_time)::INT,
         EXTRACT(HOUR FROM start_time)::INT,
         COUNT(*)
  FROM bookings WHERE status != 'cancelled'
  GROUP BY 1, 2 ORDER BY 1, 2;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_department_allocation_summary()
RETURNS TABLE(department_name TEXT, total_allocated BIGINT, total_assets BIGINT, utilization_pct NUMERIC) AS $$
  SELECT d.name,
    COUNT(*) FILTER (WHERE a.status = 'allocated'),
    COUNT(*),
    ROUND(COUNT(*) FILTER (WHERE a.status = 'allocated')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1)
  FROM assets a
  JOIN departments d ON d.id = a.department_id
  GROUP BY d.name ORDER BY d.name;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
