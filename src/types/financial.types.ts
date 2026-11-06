/**
 * Financial management, commission calculation, and payout types.
 */

// ============================================================================
// Session Financials
// ============================================================================

export interface SessionFinancial {
  id: string;
  appointment_id: string;
  
  // Duration
  scheduled_duration_minutes: number;
  actual_duration_minutes: number | null;
  billable_duration_minutes: number | null;
  
  // Pricing
  base_amount: number; // Decimal (e.g., 60.00)
  currency: string;
  
  // Commission
  commission_rate: number; // Decimal (e.g., 0.2000)
  commission_amount: number;
  psychiatrist_amount: number;
  
  // Adjustments
  refund_amount: number;
  adjustment_amount: number;
  adjustment_reason: string | null;
  
  // Fees
  payment_processing_fee: number;
  
  // Final Amounts
  net_platform_revenue: number;
  net_psychiatrist_payout: number;
  
  // Status
  financial_status: FinancialStatus;
  
  // Payout
  payout_transaction_id: string | null;
  payout_completed_at: string | null;
  
  // Audit
  calculated_at: string | null;
  calculated_by: string | null;
  last_modified_by: string | null;
  
  created_at: string;
  updated_at: string;
}

export type FinancialStatus =
  | 'pending'
  | 'calculated'
  | 'payment_received'
  | 'payout_pending'
  | 'payout_completed'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed';

// ============================================================================
// Commission Ledger
// ============================================================================

export interface CommissionLedgerEntry {
  id: string;
  appointment_id: string;
  
  // Transaction
  transaction_type: TransactionType;
  
  // Amounts
  amount: number;
  currency: string;
  
  // Parties
  from_party: Party | null;
  to_party: Party | null;
  
  // References
  reference_transaction_id: string | null;
  external_transaction_id: string | null;
  
  // Description
  description: string;
  metadata: Record<string, any> | null;
  
  // Audit
  created_by: string | null;
  created_at: string;
}

export type TransactionType =
  | 'booking_payment'
  | 'commission_allocation'
  | 'psychiatrist_payout'
  | 'refund'
  | 'adjustment'
  | 'dispute_resolution'
  | 'payment_fee';

export type Party = 'patient' | 'platform' | 'psychiatrist' | 'payment_provider';

// ============================================================================
// Create & Update Payloads
// ============================================================================

export interface CreateSessionFinancialPayload {
  appointment_id: string;
  scheduled_duration_minutes: number;
  base_amount: number;
  currency: string;
  commission_rate: number;
}

export interface UpdateSessionFinancialPayload {
  actual_duration_minutes?: number;
  billable_duration_minutes?: number;
  financial_status?: FinancialStatus;
  refund_amount?: number;
  adjustment_amount?: number;
  adjustment_reason?: string;
  payment_processing_fee?: number;
  payout_transaction_id?: string;
}

export interface CreateLedgerEntryPayload {
  appointment_id: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  from_party?: Party;
  to_party?: Party;
  description: string;
  reference_transaction_id?: string;
  external_transaction_id?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Financial Calculations
// ============================================================================

export interface CommissionCalculation {
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  psychiatrist_amount: number;
  payment_processing_fee: number;
  net_platform_revenue: number;
  net_psychiatrist_payout: number;
}

export interface RefundCalculation {
  original_amount: number;
  refund_amount: number;
  refund_percentage: number;
  commission_refund: number;
  psychiatrist_refund: number;
  net_refund_to_patient: number;
}

export interface SessionPricing {
  duration_minutes: 15 | 30 | 60;
  base_price: number;
  currency: string;
  commission_rate: number;
  estimated_psychiatrist_earning: number;
  payment_processing_fee_estimate: number;
}

// ============================================================================
// Psychiatrist Earnings
// ============================================================================

export interface PsychiatristEarnings {
  psychiatrist_id: string;
  
  // Overview
  total_sessions: number;
  completed_sessions: number;
  total_minutes: number;
  
  // Financial
  total_earned: number;
  pending_payout: number;
  paid_out: number;
  
  // Breakdown by duration
  earnings_by_duration: {
    15: { count: number; amount: number };
    30: { count: number; amount: number };
    60: { count: number; amount: number };
  };
  
  // Recent activity
  last_session_date: string | null;
  last_payout_date: string | null;
  
  // Period
  period_start: string;
  period_end: string;
  
  currency: string;
}

export interface PsychiatristPayoutHistory {
  payouts: Payout[];
  total_paid_out: number;
  currency: string;
}

export interface Payout {
  id: string;
  payout_transaction_id: string;
  amount: number;
  currency: string;
  sessions_count: number;
  session_ids: string[];
  payout_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: string | null;
  external_reference: string | null;
}

// ============================================================================
// Admin Financial Overview
// ============================================================================

export interface PlatformFinancialOverview {
  // Period
  period_start: string;
  period_end: string;
  
  // Sessions
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  
  // Revenue
  gross_revenue: number;
  total_refunds: number;
  net_revenue: number;
  
  // Commission
  total_commission: number;
  total_psychiatrist_payouts: number;
  pending_payouts: number;
  
  // Fees
  payment_processing_fees: number;
  
  // Net platform revenue
  net_platform_revenue: number;
  
  // Breakdown
  revenue_by_duration: {
    15: number;
    30: number;
    60: number;
  };
  
  // Top performers
  top_psychiatrists: Array<{
    psychiatrist_id: string;
    name: string;
    sessions_count: number;
    total_earned: number;
  }>;
  
  currency: string;
}

export interface FinancialMetrics {
  // Daily/Weekly/Monthly metrics
  period: 'day' | 'week' | 'month' | 'year';
  date: string;
  
  // Metrics
  sessions_completed: number;
  gross_revenue: number;
  commission_earned: number;
  refunds_issued: number;
  payouts_completed: number;
  
  // Growth
  growth_percentage: number | null;
  previous_period_value: number | null;
}

// ============================================================================
// Queries & Filters
// ============================================================================

export interface FinancialQueryParams {
  from_date?: string;
  to_date?: string;
  psychiatrist_id?: string;
  financial_status?: FinancialStatus[];
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}

export interface LedgerQueryParams {
  appointment_id?: string;
  transaction_type?: TransactionType[];
  from_date?: string;
  to_date?: string;
  party?: Party;
  page?: number;
  limit?: number;
}

export interface EarningsQueryParams {
  psychiatrist_id: string;
  from_date?: string;
  to_date?: string;
  include_pending?: boolean;
}

// ============================================================================
// Pricing Configuration
// ============================================================================

export interface PricingConfig {
  session_prices: {
    15: number;
    30: number;
    60: number;
  };
  currency: string;
  commission_rate: number;
  effective_date: string;
}

export interface UpdatePricingPayload {
  session_prices?: {
    15?: number;
    30?: number;
    60?: number;
  };
  commission_rate?: number;
  effective_date?: string;
}

// ============================================================================
// Dispute Management
// ============================================================================

export interface DisputeRequest {
  appointment_id: string;
  reason: string;
  description: string;
  requested_resolution: 'full_refund' | 'partial_refund' | 'adjustment' | 'review';
  supporting_evidence?: string[];
}

export interface Dispute {
  id: string;
  appointment_id: string;
  filed_by: string;
  filed_by_role: 'patient' | 'psychiatrist';
  reason: string;
  description: string;
  requested_resolution: string;
  
  // Status
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  
  // Resolution
  resolution: string | null;
  resolution_date: string | null;
  resolved_by: string | null;
  
  // Financial impact
  adjustment_amount: number | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SessionFinancialResponse {
  financial: SessionFinancial;
  ledger_entries: CommissionLedgerEntry[];
  appointment: {
    id: string;
    patient_name: string;
    psychiatrist_name: string;
    scheduled_start_time: string;
    status: string;
  };
}

export interface EarningsResponse {
  earnings: PsychiatristEarnings;
  recent_sessions: Array<{
    appointment_id: string;
    date: string;
    duration_minutes: number;
    amount_earned: number;
    payout_status: string;
  }>;
}

export interface FinancialOverviewResponse {
  overview: PlatformFinancialOverview;
  metrics: FinancialMetrics[];
  recent_transactions: CommissionLedgerEntry[];
}

export interface PayoutBatchRequest {
  psychiatrist_ids: string[];
  min_amount?: number;
  payment_method: string;
}

export interface PayoutBatchResponse {
  payouts_created: number;
  total_amount: number;
  currency: string;
  payout_ids: string[];
  errors: Array<{
    psychiatrist_id: string;
    error: string;
  }>;
}
