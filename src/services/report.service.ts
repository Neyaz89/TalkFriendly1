/**
 * Report service.
 * Handles content and user reporting for safety and moderation.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Report,
  ReportWithReporter,
  CreateReportPayload,
  UpdateReportPayload,
  ReportListParams,
} from '@/types';

export const reportService = {
  /**
   * Submit a report
   */
  async createReport(payload: CreateReportPayload): Promise<Report> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_id: payload.reported_id,
        report_type: payload.report_type,
        entity_id: payload.entity_id,
        reason: payload.reason,
        description: payload.description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Get user's own reports
   */
  async getMyReports(params?: ReportListParams): Promise<{ reports: Report[]; total: number }> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('reporter_id', user.id);

    // Filter by status
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    // Filter by type
    if (params?.report_type) {
      query = query.eq('report_type', params.report_type);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      reports: data || [],
      total: count || 0,
    };
  },

  /**
   * Get all reports (admin only)
   */
  async getAllReports(params?: ReportListParams): Promise<{ reports: ReportWithReporter[]; total: number }> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(
          id, username, full_name
        ),
        reported_user:profiles!reported_id(
          id, username, full_name
        )
      `, { count: 'exact' });

    // Filter by status
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    // Filter by type
    if (params?.report_type) {
      query = query.eq('report_type', params.report_type);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      reports: (data || []) as ReportWithReporter[],
      total: count || 0,
    };
  },

  /**
   * Update report status (admin only)
   */
  async updateReport(reportId: string, payload: UpdateReportPayload): Promise<Report> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    if (payload.status === 'resolved' || payload.status === 'dismissed') {
      updateData.resolved_by = user.id;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<ReportWithReporter> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(
          id, username, full_name
        ),
        reported_user:profiles!reported_id(
          id, username, full_name
        )
      `)
      .eq('id', reportId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Report not found');

    // Check if user is admin or the reporter
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type !== 'admin' && data.reporter_id !== user.id) {
      throw new Error('Unauthorized');
    }

    return data as ReportWithReporter;
  },

  /**
   * Delete a report (admin only)
   */
  async deleteReport(reportId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
  },

  /**
   * Get report statistics (admin only)
   */
  async getReportStats(): Promise<{
    total: number;
    pending: number;
    investigating: number;
    resolved: number;
    dismissed: number;
    by_type: { [key: string]: number };
  }> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get counts by status
    const { data: statusCounts } = await supabase
      .from('reports')
      .select('status');

    // Get counts by type
    const { data: typeCounts } = await supabase
      .from('reports')
      .select('report_type');

    const stats = {
      total: statusCounts?.length || 0,
      pending: statusCounts?.filter(r => r.status === 'pending').length || 0,
      investigating: statusCounts?.filter(r => r.status === 'investigating').length || 0,
      resolved: statusCounts?.filter(r => r.status === 'resolved').length || 0,
      dismissed: statusCounts?.filter(r => r.status === 'dismissed').length || 0,
      by_type: {} as { [key: string]: number },
    };

    // Count by type
    typeCounts?.forEach(report => {
      stats.by_type[report.report_type] = (stats.by_type[report.report_type] || 0) + 1;
    });

    return stats;
  },
};
