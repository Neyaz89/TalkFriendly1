/**
 * Admin system TypeScript types
 * Covers admin authentication, permissions, roles, and activity logging
 */

// ============================================================================
// Admin User & Authentication
// ============================================================================

export interface AdminUser {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  account_type: 'admin';
  is_active: boolean;
  created_at: string;
  permissions: AdminPermission[];
  roles: string[];
}

export interface AdminSession {
  id: string;
  user_id: string;
  session_token: string;
  mfa_verified: boolean;
  mfa_verified_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
  is_active: boolean;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
  mfa_code?: string;
}

export interface AdminLoginResponse {
  user: AdminUser;
  session: AdminSession;
  requires_mfa: boolean;
  permissions: string[];
}

// ============================================================================
// Admin Roles & Permissions
// ============================================================================

export type AdminPermissionType =
  | 'super_admin'
  | 'manage_users'
  | 'manage_listeners'
  | 'review_applications'
  | 'manage_appointments'
  | 'manage_financials'
  | 'execute_payouts'
  | 'manage_refunds'
  | 'view_analytics'
  | 'manage_moderation'
  | 'manage_reports'
  | 'manage_platform_settings'
  | 'view_audit_logs'
  | 'manage_admins';

export interface AdminRole {
  id: string;
  role_name: string;
  role_description: string | null;
  permission_level: number; // 1-100
  is_active: boolean;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  user_id: string;
  permission: AdminPermissionType;
  scope_restrictions: Record<string, any> | null;
  is_active: boolean;
  granted_by: string;
  granted_at: string;
  revoked_by: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  grant_reason: string | null;
  revoke_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrantPermissionPayload {
  user_id: string;
  permission: AdminPermissionType;
  scope_restrictions?: Record<string, any>;
  expires_at?: string;
  grant_reason?: string;
}

export interface RevokePermissionPayload {
  user_id: string;
  permission: AdminPermissionType;
  revoke_reason: string;
}

// ============================================================================
// Admin Activity Logging
// ============================================================================

export type AdminActionType =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'user_viewed'
  | 'user_suspended'
  | 'user_activated'
  | 'user_deleted'
  | 'listener_viewed'
  | 'listener_approved'
  | 'listener_rejected'
  | 'listener_suspended'
  | 'listener_reactivated'
  | 'application_reviewed'
  | 'application_approved'
  | 'application_rejected'
  | 'additional_info_requested'
  | 'appointment_viewed'
  | 'appointment_cancelled'
  | 'appointment_modified'
  | 'financial_viewed'
  | 'payout_executed'
  | 'refund_processed'
  | 'commission_adjusted'
  | 'report_reviewed'
  | 'report_resolved'
  | 'user_blocked'
  | 'content_removed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'admin_created'
  | 'admin_deleted'
  | 'setting_changed'
  | 'config_updated'
  | 'document_accessed'
  | 'sensitive_data_accessed';

export type AdminTargetType =
  | 'user'
  | 'listener'
  | 'application'
  | 'appointment'
  | 'financial_record'
  | 'report'
  | 'admin'
  | 'setting'
  | 'document';

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  admin_username: string;
  admin_email: string;
  action_type: AdminActionType;
  action_description: string;
  target_type: AdminTargetType | null;
  target_id: string | null;
  target_identifier: string | null;
  changes_made: Record<string, any> | null;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface LogAdminActivityPayload {
  action_type: AdminActionType;
  action_description: string;
  target_type?: AdminTargetType;
  target_id?: string;
  target_identifier?: string;
  reason?: string;
  changes_made?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AdminActivityLogFilter {
  admin_user_id?: string;
  action_types?: AdminActionType[];
  target_type?: AdminTargetType;
  target_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminActivityLogResponse {
  logs: AdminActivityLog[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// Admin Dashboard Analytics
// ============================================================================

export interface AdminDashboardStats {
  users: {
    total_users: number;
    total_listeners: number;
    pending_applications: number;
    approved_listeners: number;
    rejected_applications: number;
    suspended_accounts: number;
    new_users_today: number;
    new_users_this_week: number;
    new_users_this_month: number;
    active_users: number;
  };
  appointments: {
    total_appointments: number;
    upcoming_appointments: number;
    completed_sessions: number;
    cancelled_sessions: number;
    no_show_sessions: number;
    pending_attendance: number;
    today_sessions: number;
    this_week_sessions: number;
    this_month_sessions: number;
  };
  financials: {
    total_revenue: number;
    gross_revenue: number;
    platform_commission: number;
    listener_earnings: number;
    pending_payouts: number;
    completed_payouts: number;
    refunds_issued: number;
    payment_failures: number;
    today_revenue: number;
    this_week_revenue: number;
    this_month_revenue: number;
  };
  engagement: {
    total_posts: number;
    total_connections: number;
    pending_connection_requests: number;
    total_conversations: number;
    total_messages: number;
    active_conversations: number;
  };
  moderation: {
    pending_reports: number;
    resolved_reports: number;
    blocked_users: number;
    removed_content: number;
  };
}

export interface AdminChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface AdminAnalyticsResponse {
  stats: AdminDashboardStats;
  charts: {
    user_registrations: AdminChartData;
    appointment_trends: AdminChartData;
    revenue_trends: AdminChartData;
    listener_application_status: AdminChartData;
  };
}

// ============================================================================
// Platform Analytics Cache
// ============================================================================

export type AnalyticsPeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';

export interface PlatformAnalyticsCache {
  id: string;
  metric_type: string;
  period_type: AnalyticsPeriodType;
  period_start: string;
  period_end: string;
  metric_data: Record<string, any>;
  computed_at: string;
  expires_at: string | null;
}

// ============================================================================
// Admin Management
// ============================================================================

export interface CreateAdminPayload {
  email: string;
  password: string;
  username: string;
  full_name: string;
  permissions: AdminPermissionType[];
  grant_reason?: string;
}

export interface UpdateAdminPayload {
  full_name?: string;
  is_active?: boolean;
  avatar_url?: string;
}

export interface AdminListFilter {
  search?: string;
  is_active?: boolean;
  permission?: AdminPermissionType;
  page?: number;
  limit?: number;
}

export interface AdminListResponse {
  admins: AdminUser[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// Admin Authorization Helper
// ============================================================================

export interface AdminAuthContext {
  user: AdminUser;
  permissions: AdminPermissionType[];
  hasPermission: (permission: AdminPermissionType) => boolean;
  hasAnyPermission: (permissions: AdminPermissionType[]) => boolean;
  hasAllPermissions: (permissions: AdminPermissionType[]) => boolean;
  isSuperAdmin: boolean;
}
