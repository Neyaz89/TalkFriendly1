/**
 * Support form types for internal communication between listeners and users.
 * Forms are sent as special message types in conversations.
 */

// ─── Field Types ──────────────────────────────────────────────────────────────

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio' 
  | 'file';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, multiselect, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order: number;
}

// ─── Form Definition ──────────────────────────────────────────────────────────

export interface SupportForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  created_by: string; // listener_id
  created_at: string;
  updated_at: string;
}

export type SupportFormInsert = Omit<SupportForm, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SupportFormUpdate = Partial<SupportFormInsert>;

// ─── Form Submission ──────────────────────────────────────────────────────────

export type FormSubmissionStatus = 'pending' | 'reviewing' | 'completed' | 'cancelled';

export interface FormFieldResponse {
  field_id: string;
  value: string | string[] | boolean | number;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  message_id: string; // Link to the message that contains this form request
  conversation_id: string;
  submitted_by: string; // user_id
  responses: FormFieldResponse[];
  status: FormSubmissionStatus;
  reviewed_by?: string; // listener_id
  reviewed_at?: string;
  notes?: string; // Listener notes about the submission
  created_at: string;
  updated_at: string;
}

export type FormSubmissionInsert = Omit<FormSubmission, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FormSubmissionUpdate = Partial<FormSubmissionInsert>;

// ─── Form Message Payload ─────────────────────────────────────────────────────

/**
 * This is stored in message.content as JSON when message_type = 'support_form_request'
 */
export interface SupportFormMessagePayload {
  form_id: string;
  title: string;
  description?: string;
  fields: FormField[];
  submission_id?: string; // Set after user submits
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface SendFormRequestPayload {
  conversation_id: string;
  form_id: string;
}

export interface SubmitFormPayload {
  message_id: string;
  form_id: string;
  responses: FormFieldResponse[];
}

export interface ReviewFormSubmissionPayload {
  submission_id: string;
  status: FormSubmissionStatus;
  notes?: string;
}
