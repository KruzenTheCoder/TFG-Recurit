export interface User {
  id: string
  email: string
  role: 'admin' | 'recruiter'
  created_at: string
}

export interface Campaign {
  id: string
  title: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'closed'
  form_id: string
  created_at: string
  updated_at: string
  application_count?: number
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'date' | 'tel'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
  }
  file_types?: string[]
  help_text?: string
}

export interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  campaign_id: string
  form_id: string
  data: Record<string, string | string[]>
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected'
  email: string
  name: string
  phone?: string
  resume_url?: string
  cover_letter?: string
  rating?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ApplicationStatus {
  id: string
  candidate_id: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected'
  notes?: string
  reviewed_by?: string
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'application_received' | 'under_review' | 'accepted' | 'rejected'
}

export interface DashboardStats {
  total_campaigns: number
  active_campaigns: number
  total_applications: number
  pending_reviews: number
  accepted_candidates: number
  rejected_candidates: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface FormBuilderState {
  currentForm: Form | null
  isEditing: boolean
  selectedField: FormField | null
}
