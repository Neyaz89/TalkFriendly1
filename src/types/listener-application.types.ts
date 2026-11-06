/**
 * Listener Application & Verification System TypeScript types
 * Covers the complete application workflow from submission to approval/rejection
 */

// ============================================================================
// Application Status
// ============================================================================

export type ListenerApplicationStatus =
  | 'draft'
  | 'pending_review'
  | 'under_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type VerificationDocumentType =
  | 'license'
  | 'certificate'
  | 'degree'
  | 'identification'
  | 'insurance'
  | 'other';

// ============================================================================
// Verification Document
// ============================================================================

export interface VerificationDocument {
  type: VerificationDocumentType;
  url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  description?: string;
}

// ============================================================================
// Listener Application
// ============================================================================

export interface ListenerApplication {
  id: string;
  user_id: string;
  
  // Personal Information
  full_legal_name: string;
  email: string;
  phone: string;
  country: string;
  city: string | null;
  state_province: string | null;
  
  // Professional Information
  professional_title: string;
  qualifications: string[];
  educational_institution: string;
  specialization: string[];
  years_of_experience: number;
  professional_bio: string;
  languages_spoken: string[];
  areas_of_expertise: string[];
  
  // Verification Details
  license_number: string | null;
  licensing_authority: string | null;
  license_country: string | null;
  license_state_province: string | null;
  license_expiry_date: string | null;
  
  // Documents
  profile_photo_url: string | null;
  verification_documents: VerificationDocument[];
  
  // Application Status
  status: ListenerApplicationStatus;
  
  // Review Process
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  additional_info_requested: string | null;
  admin_internal_notes: string | null;
  
  // Resubmission
  is_resubmission: boolean;
  original_application_id: string | null;
  resubmission_count: number;
  
  // Timestamps
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Application with Relations
// ============================================================================

export interface ListenerApplicationWithDetails extends ListenerApplication {
  applicant?: {
    id: string;
    username: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reviewer?: {
    id: string;
    username: string;
    full_name: string | null;
    email: string;
  };
  status_history?: ApplicationStatusHistoryEntry[];
}

// ============================================================================
// Application Status History
// ============================================================================

export interface ApplicationStatusHistoryEntry {
  id: string;
  application_id: string;
  from_status: ListenerApplicationStatus | null;
  to_status: ListenerApplicationStatus;
  changed_by: string;
  change_reason: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  admin_details?: {
    username: string;
    full_name: string | null;
  };
}

// ============================================================================
// Application Form Payloads
// ============================================================================

export interface CreateListenerApplicationPayload {
  // Personal Information
  full_legal_name: string;
  phone: string;
  country: string;
  city?: string;
  state_province?: string;
  
  // Professional Information
  professional_title: string;
  qualifications: string[];
  educational_institution: string;
  specialization: string[];
  years_of_experience: number;
  professional_bio: string;
  languages_spoken: string[];
  areas_of_expertise: string[];
  
  // Verification Details
  license_number?: string;
  licensing_authority?: string;
  license_country?: string;
  license_state_province?: string;
  license_expiry_date?: string;
  
  // Save as draft or submit
  save_as_draft?: boolean;
}

export interface UpdateListenerApplicationPayload {
  // Any field from CreateListenerApplicationPayload can be updated
  [key: string]: any;
  save_as_draft?: boolean;
}

export interface SubmitListenerApplicationPayload {
  application_id: string;
  final_review_consent: boolean;
}

// ============================================================================
// Document Upload
// ============================================================================

export interface UploadVerificationDocumentPayload {
  application_id: string;
  document_type: VerificationDocumentType;
  file: File;
  description?: string;
}

export interface UploadVerificationDocumentResponse {
  document: VerificationDocument;
  application_id: string;
}

export interface DeleteVerificationDocumentPayload {
  application_id: string;
  document_url: string;
}

// ============================================================================
// Admin Review Actions
// ============================================================================

export interface ReviewApplicationPayload {
  application_id: string;
  action: 'start_review' | 'request_info' | 'approve' | 'reject';
  review_notes?: string;
  rejection_reason?: string;
  additional_info_requested?: string;
  admin_internal_notes?: string;
}

export interface ApproveApplicationPayload {
  application_id: string;
  review_notes?: string;
  admin_internal_notes?: string;
}

export interface RejectApplicationPayload {
  application_id: string;
  rejection_reason: string;
  review_notes?: string;
  admin_internal_notes?: string;
  allow_resubmission?: boolean;
}

export interface RequestAdditionalInfoPayload {
  application_id: string;
  additional_info_requested: string;
  review_notes?: string;
}

export interface SuspendListenerPayload {
  listener_user_id: string;
  suspension_reason: string;
  notify_user?: boolean;
}

export interface ReactivateListenerPayload {
  listener_user_id: string;
  reactivation_notes?: string;
}

// ============================================================================
// Application Filters & Queries
// ============================================================================

export interface ListenerApplicationFilter {
  status?: ListenerApplicationStatus[];
  country?: string;
  specialization?: string[];
  search?: string; // Search by name, email
  reviewed_by?: string;
  submitted_from?: string;
  submitted_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'submitted_at' | 'updated_at' | 'full_legal_name';
  sort_order?: 'asc' | 'desc';
}

export interface ListenerApplicationListResponse {
  applications: ListenerApplicationWithDetails[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  stats?: {
    pending_review: number;
    under_review: number;
    approved: number;
    rejected: number;
    additional_info_required: number;
  };
}

// ============================================================================
// Listener Management (Admin)
// ============================================================================

export interface ListenerManagementFilter {
  verification_status?: 'pending' | 'verified' | 'rejected';
  is_active?: boolean;
  specialization?: string[];
  country?: string;
  search?: string;
  min_rating?: number;
  has_appointments?: boolean;
  page?: number;
  limit?: number;
}

export interface ListenerWithStats {
  id: string;
  user_id: string;
  name: string;
  email: string;
  professional_title: string | null;
  specialization: string[];
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  rating: number;
  reviews_count: number;
  avatar_url: string | null;
  created_at: string;
  verified_at: string | null;
  stats?: {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    total_earnings: number;
    pending_payouts: number;
    active_patients: number;
  };
}

export interface ListenerListResponse {
  listeners: ListenerWithStats[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// Application Applicant View
// ============================================================================

export interface ApplicationStatusInfo {
  status: ListenerApplicationStatus;
  status_label: string;
  status_description: string;
  can_edit: boolean;
  can_resubmit: boolean;
  next_steps: string;
  estimated_review_time?: string;
  feedback?: {
    review_notes: string | null;
    rejection_reason: string | null;
    additional_info_requested: string | null;
  };
}

export interface ApplicationProgressStep {
  step: number;
  title: string;
  status: 'completed' | 'current' | 'pending';
  completed_at: string | null;
}

// ============================================================================
// Validation Schemas (for Zod)
// ============================================================================

export interface ListenerApplicationValidationRules {
  full_legal_name: { min: number; max: number };
  phone: { pattern: RegExp };
  professional_title: { min: number; max: number };
  qualifications: { min_items: number; max_items: number };
  educational_institution: { min: number; max: number };
  specialization: { min_items: number; max_items: number };
  years_of_experience: { min: number; max: number };
  professional_bio: { min: number; max: number };
  languages_spoken: { min_items: number };
  areas_of_expertise: { min_items: number; max_items: number };
  verification_documents: { min_files: number; max_files: number; max_file_size: number };
}

// ============================================================================
// Response Types
// ============================================================================

export interface CreateApplicationResponse {
  application: ListenerApplication;
  message: string;
  next_steps: string[];
}

export interface SubmitApplicationResponse {
  application: ListenerApplication;
  message: string;
  estimated_review_time: string;
}

export interface ReviewApplicationResponse {
  application: ListenerApplicationWithDetails;
  message: string;
  listener_profile_created?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApplicationError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export type ApplicationErrorCode =
  | 'application_not_found'
  | 'already_has_application'
  | 'already_verified_listener'
  | 'invalid_status_transition'
  | 'missing_required_documents'
  | 'document_upload_failed'
  | 'unauthorized_action'
  | 'validation_failed';
