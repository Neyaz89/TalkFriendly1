/**
 * Financial Service
 * 
 * Handles:
 * - Commission calculation and session financials
 * - Ledger entry creation and tracking
 * - Psychiatrist earnings and payouts
 * - Refunds and adjustments
 * - Platform financial metrics
 * - Dispute management
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type {
  SessionFinancial,
  CommissionLedgerEntry,
  PsychiatristEarnings,
  PsychiatristPayoutHistory,
  Payout,
  PlatformFinancialOverview,
  FinancialMetrics,
  CommissionCalculation,
  RefundCalculation,
  SessionPricing,
  CreateSessionFinancialPayload,
  UpdateSessionFinancialPayload,
  CreateLedgerEntryPayload,
  FinancialQueryParams,
  LedgerQueryParams,
  EarningsQueryParams,
  DisputeRequest,
  Dispute,
  FinancialStatus,
  TransactionType,
} from '@/types';

// ============================================================================
// Commission Calculation
// ============================================================================

export const financialService = {
  /**
   * Calculate commission for a session
   */
  calculateCommission(
    baseAmount: number,
    commissionRate: number,
    paymentProcessingFee: number = 0
  ): CommissionCalculation {
    const commissionAmount = Math.round(baseAmount * commissionRate * 100) / 100;
    const psychiatristAmount = Math.round((baseAmount - commissionAmount) * 100) / 100;
    const netPlatformRevenue = Math.round((commissionAmount - paymentProcessingFee) * 100) / 100;
    const netPsychiatristPayout = psychiatristAmount;

    return {
      base_amount: baseAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      psychiatrist_amount: psychiatristAmount,
      payment_processing_fee: paymentProcessingFee,
      net_platform_revenue: netPlatformRevenue,
      net_psychiatrist_payout: netPsychiatristPayout,
    };
  },

  /**
   * Calculate refund amounts
   */
  calculateRefund(
    originalAmount: number,
    commissionRate: number,
    refundPercentage: number
  ): RefundCalculation {
    const refundAmount = Math.round(originalAmount * refundPercentage * 100) / 100;
    const commissionRefund = Math.round(refundAmount * commissionRate * 100) / 100;
    const psychiatristRefund = Math.round(refundAmount * (1 - commissionRate) * 100) / 100;

    return {
      original_amount: originalAmount,
      refund_amount: refundAmount,
      refund_percentage: refundPercentage,
      commission_refund: commissionRefund,
      psychiatrist_refund: psychiatristRefund,
      net_refund_to_patient: refundAmount,
    };
  },

  /**
   * Create session financials after appointment confirmation
   */
  async createSessionFinancials(
    payload: CreateSessionFinancialPayload,
    useServerClient: boolean = true
  ): Promise<SessionFinancial> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Calculate commission
    const calculation = this.calculateCommission(
      payload.base_amount,
      payload.commission_rate
    );

    const { data, error } = await supabase
      .from('session_financials')
      .insert({
        appointment_id: payload.appointment_id,
        scheduled_duration_minutes: payload.scheduled_duration_minutes,
        base_amount: payload.base_amount,
        currency: payload.currency,
        commission_rate: payload.commission_rate,
        commission_amount: calculation.commission_amount,
        psychiatrist_amount: calculation.psychiatrist_amount,
        net_platform_revenue: calculation.net_platform_revenue,
        net_psychiatrist_payout: calculation.net_psychiatrist_payout,
        financial_status: 'pending',
        calculated_at: new Date().toISOString(),
        calculated_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session financials: ${error.message}`);
    }

    return data as SessionFinancial;
  },

  /**
   * Update session financials
   */
  async updateSessionFinancials(
    appointmentId: string,
    payload: UpdateSessionFinancialPayload,
    useServerClient: boolean = true
  ): Promise<SessionFinancial> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updateData: any = {
      ...payload,
      last_modified_by: user?.id || null,
    };

    // Recalculate amounts if adjustments are made
    if (payload.refund_amount || payload.adjustment_amount) {
      const { data: financial } = await supabase
        .from('session_financials')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (financial) {
        updateData.net_platform_revenue =
          financial.commission_amount -
          (payload.refund_amount || 0) * financial.commission_rate -
          (payload.adjustment_amount || 0);

        updateData.net_psychiatrist_payout =
          financial.psychiatrist_amount -
          (payload.refund_amount || 0) * (1 - financial.commission_rate);
      }
    }

    const { data, error } = await supabase
      .from('session_financials')
      .update(updateData)
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update session financials: ${error.message}`);
    }

    return data as SessionFinancial;
  },

  /**
   * Get session financials
   */
  async getSessionFinancials(
    appointmentId: string,
    useServerClient: boolean = true
  ): Promise<SessionFinancial | null> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const { data, error } = await supabase
      .from('session_financials')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (error) {
      return null;
    }

    return data as SessionFinancial;
  },

  /**
   * Finalize session financials after completion
   */
  async finalizeSessionFinancials(
    appointmentId: string,
    useServerClient: boolean = true
  ): Promise<SessionFinancial> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Get current financial record
    const financial = await this.getSessionFinancials(appointmentId, useServerClient);
    if (!financial) {
      throw new Error('Session financials not found');
    }

    // Update status to payout_pending
    const { data, error } = await supabase
      .from('session_financials')
      .update({
        financial_status: 'payout_pending',
      })
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to finalize session financials: ${error.message}`);
    }

    // Create payout ledger entry
    await this.createLedgerEntry({
      appointment_id: appointmentId,
      transaction_type: 'psychiatrist_payout',
      amount: financial.net_psychiatrist_payout,
      currency: financial.currency,
      from_party: 'platform',
      to_party: 'psychiatrist',
      description: 'Psychiatrist payout for completed session',
    });

    return data as SessionFinancial;
  },

  // ============================================================================
  // Ledger Management
  // ============================================================================

  /**
   * Create a ledger entry
   */
  async createLedgerEntry(
    payload: CreateLedgerEntryPayload,
    useServerClient: boolean = true
  ): Promise<CommissionLedgerEntry> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('commission_ledger')
      .insert({
        appointment_id: payload.appointment_id,
        transaction_type: payload.transaction_type,
        amount: payload.amount,
        currency: payload.currency,
        from_party: payload.from_party || null,
        to_party: payload.to_party || null,
        description: payload.description,
        reference_transaction_id: payload.reference_transaction_id || null,
        external_transaction_id: payload.external_transaction_id || null,
        metadata: payload.metadata || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ledger entry: ${error.message}`);
    }

    return data as CommissionLedgerEntry;
  },

  /**
   * Get ledger entries
   */
  async getLedgerEntries(
    params: LedgerQueryParams,
    useServerClient: boolean = true
  ): Promise<{ entries: CommissionLedgerEntry[]; total: number }> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    let query = supabase
      .from('commission_ledger')
      .select('*', { count: 'exact' });

    // Apply filters
    if (params.appointment_id) {
      query = query.eq('appointment_id', params.appointment_id);
    }

    if (params.transaction_type && params.transaction_type.length > 0) {
      query = query.in('transaction_type', params.transaction_type);
    }

    if (params.from_date) {
      query = query.gte('created_at', params.from_date);
    }

    if (params.to_date) {
      query = query.lte('created_at', params.to_date);
    }

    if (params.party) {
      query = query.or(`from_party.eq.${params.party},to_party.eq.${params.party}`);
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch ledger entries: ${error.message}`);
    }

    return {
      entries: (data || []) as CommissionLedgerEntry[],
      total: count || 0,
    };
  },

  // ============================================================================
  // Psychiatrist Earnings
  // ============================================================================

  /**
   * Get psychiatrist earnings
   */
  async getPsychiatristEarnings(
    params: EarningsQueryParams,
    useServerClient: boolean = true
  ): Promise<PsychiatristEarnings> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const fromDate = params.from_date || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
    const toDate = params.to_date || new Date().toISOString();

    // Get all completed sessions for psychiatrist
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, duration_minutes, status, scheduled_start_time, session_financials(*)')
      .eq('psychiatrist_id', params.psychiatrist_id)
      .gte('scheduled_start_time', fromDate)
      .lte('scheduled_start_time', toDate);

    const completedSessions = appointments?.filter(
      (a) => a.status === 'completed'
    ) || [];

    let totalEarned = 0;
    let pendingPayout = 0;
    let paidOut = 0;
    let totalMinutes = 0;

    const earningsByDuration: PsychiatristEarnings['earnings_by_duration'] = {
      15: { count: 0, amount: 0 },
      30: { count: 0, amount: 0 },
      60: { count: 0, amount: 0 },
    };

    for (const appointment of completedSessions) {
      if (appointment.session_financials?.[0]) {
        const financial = appointment.session_financials[0];
        const earning = financial.net_psychiatrist_payout;

        totalEarned += earning;
        totalMinutes += appointment.duration_minutes;

        if (financial.financial_status === 'payout_pending') {
          pendingPayout += earning;
        } else if (financial.financial_status === 'payout_completed') {
          paidOut += earning;
        }

        // Track by duration
        const duration = appointment.duration_minutes as 15 | 30 | 60;
        if (earningsByDuration[duration]) {
          earningsByDuration[duration].count++;
          earningsByDuration[duration].amount += earning;
        }
      }
    }

    // Get last session and payout dates
    const lastSession = completedSessions.sort(
      (a, b) => new Date(b.scheduled_start_time).getTime() - new Date(a.scheduled_start_time).getTime()
    )[0];

    const { data: lastPayout } = await supabase
      .from('session_financials')
      .select('payout_completed_at')
      .eq('psychiatrist_id', params.psychiatrist_id)
      .not('payout_completed_at', 'is', null)
      .order('payout_completed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      psychiatrist_id: params.psychiatrist_id,
      total_sessions: appointments?.length || 0,
      completed_sessions: completedSessions.length,
      total_minutes: totalMinutes,
      total_earned: Math.round(totalEarned * 100) / 100,
      pending_payout: Math.round(pendingPayout * 100) / 100,
      paid_out: Math.round(paidOut * 100) / 100,
      earnings_by_duration: earningsByDuration,
      last_session_date: lastSession?.scheduled_start_time || null,
      last_payout_date: lastPayout?.payout_completed_at || null,
      period_start: fromDate,
      period_end: toDate,
      currency: 'USD',
    };
  },

  /**
   * Get psychiatrist payout history
   */
  async getPsychiatristPayoutHistory(
    psychiatristId: string,
    useServerClient: boolean = true
  ): Promise<PsychiatristPayoutHistory> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Get all completed payouts
    const { data: financials } = await supabase
      .from('session_financials')
      .select('*, appointment:appointments!appointment_id(psychiatrist_id)')
      .eq('financial_status', 'payout_completed')
      .not('payout_transaction_id', 'is', null);

    const psychiatristFinancials = financials?.filter(
      (f) => f.appointment?.psychiatrist_id === psychiatristId
    ) || [];

    // Group by payout transaction
    const payoutMap = new Map<string, Payout>();

    for (const financial of psychiatristFinancials) {
      const txId = financial.payout_transaction_id!;
      
      if (!payoutMap.has(txId)) {
        payoutMap.set(txId, {
          id: txId,
          payout_transaction_id: txId,
          amount: 0,
          currency: financial.currency,
          sessions_count: 0,
          session_ids: [],
          payout_date: financial.payout_completed_at || '',
          status: 'completed',
          payment_method: null,
          external_reference: null,
        });
      }

      const payout = payoutMap.get(txId)!;
      payout.amount += financial.net_psychiatrist_payout;
      payout.sessions_count++;
      payout.session_ids.push(financial.appointment_id);
    }

    const payouts = Array.from(payoutMap.values());
    const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);

    return {
      payouts,
      total_paid_out: Math.round(totalPaidOut * 100) / 100,
      currency: 'USD',
    };
  },

  /**
   * Process payout for psychiatrist
   */
  async processPayout(
    psychiatristId: string,
    sessionFinancialIds: string[],
    paymentMethod: string,
    useServerClient: boolean = true
  ): Promise<{ payout_transaction_id: string; amount: number }> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Calculate total payout amount
    const { data: financials } = await supabase
      .from('session_financials')
      .select('*, appointment:appointments!appointment_id(*)')
      .in('id', sessionFinancialIds)
      .eq('financial_status', 'payout_pending');

    const validFinancials = financials?.filter(
      (f) => f.appointment?.psychiatrist_id === psychiatristId
    ) || [];

    if (validFinancials.length === 0) {
      throw new Error('No valid sessions for payout');
    }

    const totalAmount = validFinancials.reduce(
      (sum, f) => sum + f.net_psychiatrist_payout,
      0
    );

    // Generate payout transaction ID
    const payoutTransactionId = `payout_${Date.now()}_${psychiatristId.substring(0, 8)}`;

    // Update all session financials
    await supabase
      .from('session_financials')
      .update({
        financial_status: 'payout_completed',
        payout_transaction_id: payoutTransactionId,
        payout_completed_at: new Date().toISOString(),
      })
      .in('id', sessionFinancialIds);

    // Create ledger entry
    await this.createLedgerEntry({
      appointment_id: validFinancials[0].appointment_id,
      transaction_type: 'psychiatrist_payout',
      amount: totalAmount,
      currency: 'USD',
      from_party: 'platform',
      to_party: 'psychiatrist',
      description: `Batch payout for ${validFinancials.length} sessions`,
      external_transaction_id: payoutTransactionId,
      metadata: {
        payment_method: paymentMethod,
        sessions_count: validFinancials.length,
        session_ids: sessionFinancialIds,
      },
    });

    return {
      payout_transaction_id: payoutTransactionId,
      amount: Math.round(totalAmount * 100) / 100,
    };
  },

  // ============================================================================
  // Platform Metrics
  // ============================================================================

  /**
   * Get platform financial overview
   */
  async getPlatformFinancialOverview(
    fromDate: string,
    toDate: string,
    useServerClient: boolean = true
  ): Promise<PlatformFinancialOverview> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Get all sessions in period
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, session_financials(*)')
      .gte('scheduled_start_time', fromDate)
      .lte('scheduled_start_time', toDate);

    const totalSessions = appointments?.length || 0;
    const completedSessions = appointments?.filter((a) => a.status === 'completed').length || 0;
    const cancelledSessions = appointments?.filter((a) => a.status === 'cancelled').length || 0;

    let grossRevenue = 0;
    let totalRefunds = 0;
    let totalCommission = 0;
    let totalPsychiatristPayouts = 0;
    let pendingPayouts = 0;
    let paymentProcessingFees = 0;

    const revenueByDuration = { 15: 0, 30: 0, 60: 0 };

    for (const appointment of appointments || []) {
      if (appointment.session_financials?.[0]) {
        const financial = appointment.session_financials[0];
        
        grossRevenue += financial.base_amount;
        totalRefunds += financial.refund_amount;
        totalCommission += financial.commission_amount;
        totalPsychiatristPayouts += financial.net_psychiatrist_payout;
        paymentProcessingFees += financial.payment_processing_fee;

        if (financial.financial_status === 'payout_pending') {
          pendingPayouts += financial.net_psychiatrist_payout;
        }

        // Track by duration
        const duration = appointment.duration_minutes as 15 | 30 | 60;
        if (revenueByDuration[duration] !== undefined) {
          revenueByDuration[duration] += financial.base_amount;
        }
      }
    }

    const netRevenue = grossRevenue - totalRefunds;
    const netPlatformRevenue = totalCommission - paymentProcessingFees;

    // Get top psychiatrists
    const { data: topPsychiatrists } = await supabase
      .from('session_financials')
      .select('appointment:appointments!appointment_id(psychiatrist_id, psychiatrist:profiles!psychiatrist_id(full_name)), net_psychiatrist_payout')
      .eq('financial_status', 'payout_completed')
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    const psychiatristMap = new Map<string, { name: string; count: number; earned: number }>();

    for (const item of topPsychiatrists || []) {
      const psychiatristId = item.appointment?.psychiatrist_id;
      const name = item.appointment?.psychiatrist?.full_name || 'Unknown';
      
      if (psychiatristId) {
        if (!psychiatristMap.has(psychiatristId)) {
          psychiatristMap.set(psychiatristId, { name, count: 0, earned: 0 });
        }
        const entry = psychiatristMap.get(psychiatristId)!;
        entry.count++;
        entry.earned += item.net_psychiatrist_payout;
      }
    }

    const topPsychiatristsArray = Array.from(psychiatristMap.entries())
      .map(([id, data]) => ({
        psychiatrist_id: id,
        name: data.name,
        sessions_count: data.count,
        total_earned: data.earned,
      }))
      .sort((a, b) => b.total_earned - a.total_earned)
      .slice(0, 10);

    return {
      period_start: fromDate,
      period_end: toDate,
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      cancelled_sessions: cancelledSessions,
      gross_revenue: Math.round(grossRevenue * 100) / 100,
      total_refunds: Math.round(totalRefunds * 100) / 100,
      net_revenue: Math.round(netRevenue * 100) / 100,
      total_commission: Math.round(totalCommission * 100) / 100,
      total_psychiatrist_payouts: Math.round(totalPsychiatristPayouts * 100) / 100,
      pending_payouts: Math.round(pendingPayouts * 100) / 100,
      payment_processing_fees: Math.round(paymentProcessingFees * 100) / 100,
      net_platform_revenue: Math.round(netPlatformRevenue * 100) / 100,
      revenue_by_duration: revenueByDuration,
      top_psychiatrists: topPsychiatristsArray,
      currency: 'USD',
    };
  },

  // ============================================================================
  // Refunds & Adjustments
  // ============================================================================

  /**
   * Process refund
   */
  async processRefund(
    appointmentId: string,
    refundPercentage: number,
    reason: string,
    useServerClient: boolean = true
  ): Promise<SessionFinancial> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const financial = await this.getSessionFinancials(appointmentId, useServerClient);
    if (!financial) {
      throw new Error('Session financials not found');
    }

    const refundCalc = this.calculateRefund(
      financial.base_amount,
      financial.commission_rate,
      refundPercentage
    );

    // Update session financials
    const updated = await this.updateSessionFinancials(
      appointmentId,
      {
        refund_amount: refundCalc.refund_amount,
        adjustment_reason: reason,
        financial_status: refundPercentage >= 1 ? 'refunded' : 'partially_refunded',
      },
      useServerClient
    );

    // Create ledger entry
    await this.createLedgerEntry({
      appointment_id: appointmentId,
      transaction_type: 'refund',
      amount: refundCalc.refund_amount,
      currency: financial.currency,
      from_party: 'platform',
      to_party: 'patient',
      description: `Refund: ${reason}`,
      metadata: { refund_percentage: refundPercentage },
    });

    return updated;
  },

  /**
   * Apply financial adjustment
   */
  async applyAdjustment(
    appointmentId: string,
    adjustmentAmount: number,
    reason: string,
    useServerClient: boolean = true
  ): Promise<SessionFinancial> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const updated = await this.updateSessionFinancials(
      appointmentId,
      {
        adjustment_amount: adjustmentAmount,
        adjustment_reason: reason,
      },
      useServerClient
    );

    // Create ledger entry
    await this.createLedgerEntry({
      appointment_id: appointmentId,
      transaction_type: 'adjustment',
      amount: Math.abs(adjustmentAmount),
      currency: updated.currency,
      from_party: adjustmentAmount > 0 ? 'platform' : 'psychiatrist',
      to_party: adjustmentAmount > 0 ? 'psychiatrist' : 'platform',
      description: `Adjustment: ${reason}`,
    });

    return updated;
  },

  // ============================================================================
  // Disputes
  // ============================================================================

  /**
   * File a dispute
   */
  async fileDispute(
    request: DisputeRequest,
    useServerClient: boolean = true
  ): Promise<Dispute> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Determine role
    const { data: appointment } = await supabase
      .from('appointments')
      .select('patient_id, psychiatrist_id')
      .eq('id', request.appointment_id)
      .single();

    const role = appointment?.patient_id === user.id ? 'patient' : 'psychiatrist';

    // Update financial status
    await this.updateSessionFinancials(
      request.appointment_id,
      { financial_status: 'disputed' },
      useServerClient
    );

    // Create dispute record (you'd need to create this table)
    // For now, return a mock structure
    const dispute: Dispute = {
      id: `dispute_${Date.now()}`,
      appointment_id: request.appointment_id,
      filed_by: user.id,
      filed_by_role: role,
      reason: request.reason,
      description: request.description,
      requested_resolution: request.requested_resolution,
      status: 'pending',
      resolution: null,
      resolution_date: null,
      resolved_by: null,
      adjustment_amount: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return dispute;
  },
};
