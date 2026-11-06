/**
 * Content and user reporting related TypeScript types.
 */

import type { Database } from './database.types';

export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type ReportUpdate = Database['public']['Tables']['reports']['Update'];

export type ReportType = 'user' | 'post' | 'message' | 'community';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface ReportWithReporter extends Report {
  reporter?: {
    id: string;
    username: string;
    full_name: string | null;
  };
  reported_user?: {
    id: string;
    username: string;
    full_name: string | null;
  };
}

export interface CreateReportPayload {
  report_type: ReportType;
  entity_id: string;
  reported_id?: string;
  reason: string;
  description?: string;
}

export interface UpdateReportPayload {
  status?: ReportStatus;
  resolution_notes?: string;
}

export interface ReportListParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  report_type?: ReportType;
}

export const REPORT_REASONS = {
  user: [
    'Harassment or bullying',
    'Inappropriate behavior',
    'Impersonation',
    'Spam',
    'Other',
  ],
  post: [
    'Spam or misleading',
    'Harassment or hate speech',
    'Violence or dangerous content',
    'Inappropriate content',
    'Other',
  ],
  message: [
    'Harassment',
    'Spam',
    'Inappropriate content',
    'Threatening behavior',
    'Other',
  ],
  community: [
    'Inappropriate content',
    'Harassment or hate speech',
    'Spam',
    'Misleading information',
    'Other',
  ],
} as const;
