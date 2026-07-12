-- ============================================
-- AssetFlow Database Migration: Views
-- v1.1 — materialized view for current allocation + enriched asset view
-- ============================================

-- Materialized view: current holder per asset (v1.1 Patch 1)
CREATE MATERIALIZED VIEW asset_current_allocation AS
SELECT
  a.asset_id,
  a.allocated_to    AS current_holder_id,
  a.expected_return  AS expected_return_date,
  a.allocated_at,
  a.department_id    AS allocation_department_id
FROM allocations a
WHERE a.is_active = true;

CREATE UNIQUE INDEX idx_aca_asset ON asset_current_allocation(asset_id);
CREATE INDEX idx_aca_holder ON asset_current_allocation(current_holder_id);

-- Auto-refresh materialized view on allocation changes (v1.1)
CREATE OR REPLACE FUNCTION refresh_asset_current_allocation()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY asset_current_allocation;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_refresh_aca
  AFTER INSERT OR UPDATE OR DELETE ON allocations
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_asset_current_allocation();

-- Enriched asset view — primary query surface for frontend (v1.1 Patch 1)
CREATE VIEW assets_enriched AS
SELECT
  a.*,
  c.name         AS category_name,
  c.custom_fields AS category_custom_fields,
  d.name         AS department_name,
  aca.current_holder_id,
  aca.expected_return_date,
  aca.allocated_at AS current_allocation_date,
  holder.full_name AS current_holder_name,
  holder.email     AS current_holder_email
FROM assets a
LEFT JOIN asset_categories c ON c.id = a.category_id
LEFT JOIN departments d ON d.id = a.department_id
LEFT JOIN asset_current_allocation aca ON aca.asset_id = a.id
LEFT JOIN profiles holder ON holder.id = aca.current_holder_id;

-- Dashboard KPI view
CREATE VIEW dashboard_kpis AS
SELECT
  COUNT(*) FILTER (WHERE status = 'available') AS assets_available,
  COUNT(*) FILTER (WHERE status = 'allocated') AS assets_allocated,
  (SELECT COUNT(*) FROM maintenance_requests
   WHERE status IN ('approved','technician_assigned','in_progress')
   AND DATE(created_at) = CURRENT_DATE) AS maintenance_today,
  (SELECT COUNT(*) FROM bookings
   WHERE status IN ('upcoming','ongoing')) AS active_bookings,
  (SELECT COUNT(*) FROM transfer_requests
   WHERE status = 'requested') AS pending_transfers,
  (SELECT COUNT(*) FROM allocations
   WHERE is_active = true AND expected_return IS NOT NULL
   AND expected_return < CURRENT_DATE) AS overdue_returns
FROM assets;

-- Overdue allocations view
CREATE VIEW overdue_allocations AS
SELECT
  a.id AS allocation_id,
  a.asset_id,
  ast.asset_tag,
  ast.name AS asset_name,
  a.allocated_to,
  p.full_name AS holder_name,
  a.expected_return,
  CURRENT_DATE - a.expected_return AS days_overdue
FROM allocations a
JOIN assets ast ON ast.id = a.asset_id
JOIN profiles p ON p.id = a.allocated_to
WHERE a.is_active = true
  AND a.expected_return IS NOT NULL
  AND a.expected_return < CURRENT_DATE
ORDER BY a.expected_return ASC;
