-- ============================================
-- AssetFlow Database Migration: Triggers
-- v1.1 — only retained triggers (asset tag, new user, mat view refresh)
-- trg_maintenance_status and trg_audit_cycle_close REMOVED (moved to RPCs)
-- ============================================

-- Asset tag auto-generation sequence + trigger
CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 1;

CREATE OR REPLACE FUNCTION generate_asset_tag()
RETURNS TRIGGER AS $$
BEGIN
  NEW.asset_tag := 'AF-' || LPAD(nextval('asset_tag_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_asset_tag ON assets;
CREATE TRIGGER trg_asset_tag
  BEFORE INSERT ON assets
  FOR EACH ROW
  WHEN (NEW.asset_tag IS NULL)
  EXECUTE FUNCTION generate_asset_tag();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
