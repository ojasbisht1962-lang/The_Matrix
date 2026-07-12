// ============================================
// AssetFlow Permissions — v1.1 hierarchy-aware
// admin > asset_manager > department_head > employee
// ============================================

const ROLE_LEVELS = {
  employee: 10,
  department_head: 20,
  asset_manager: 30,
  admin: 40,
};

/**
 * Core hierarchy check.
 * "Does this role have at least the privileges of the required role?"
 */
export function hasRolePrivilege(userRole, requiredRole) {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[requiredRole] ?? Infinity);
}

// Permission functions — all delegate to hasRolePrivilege
export const canRegisterAsset = (role) => hasRolePrivilege(role, 'asset_manager');
export const canAllocateAsset = (role) => hasRolePrivilege(role, 'asset_manager');
export const canApproveMaintenance = (role) => hasRolePrivilege(role, 'asset_manager');
export const canCreateAudit = (role) => hasRolePrivilege(role, 'admin');
export const canManageOrg = (role) => hasRolePrivilege(role, 'admin');
export const canViewAllAnalytics = (role) => hasRolePrivilege(role, 'asset_manager');
export const canBookResource = (role) => hasRolePrivilege(role, 'employee');
export const canRaiseMaintenance = (role) => hasRolePrivilege(role, 'employee');

export function canApproveTransfer(role, userDeptId, assetDeptId) {
  if (hasRolePrivilege(role, 'asset_manager')) return true;
  if (role === 'department_head' && userDeptId === assetDeptId) return true;
  return false;
}
