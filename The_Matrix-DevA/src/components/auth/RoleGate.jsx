// ============================================
// RoleGate — conditionally renders children
// based on v1.1 hierarchy (admin > asset_manager
// > department_head > employee)
// ============================================

import { hasRolePrivilege } from '../../lib/permissions';
import { useAuth } from '../../hooks/useAuth';

/**
 * @param {{
 *   requiredRole: 'employee'|'department_head'|'asset_manager'|'admin',
 *   children: React.ReactNode,
 *   fallback?: React.ReactNode,
 * }} props
 *
 * @example
 * // Show only to asset_manager and above
 * <RoleGate requiredRole="asset_manager">
 *   <RegisterAssetButton />
 * </RoleGate>
 *
 * @example
 * // Show alternate content for insufficient role
 * <RoleGate requiredRole="admin" fallback={<p>Admins only</p>}>
 *   <OrgSettings />
 * </RoleGate>
 */
export function RoleGate({ requiredRole, children, fallback = null }) {
  const { role, isInitializing } = useAuth();

  // Don't flash content before auth resolves
  if (isInitializing) return null;

  if (!hasRolePrivilege(role, requiredRole)) {
    return fallback;
  }

  return children;
}
