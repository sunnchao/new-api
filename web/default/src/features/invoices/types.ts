export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface PageResponse<T> {
  page: number
  page_size: number
  total: number
  items: T[]
}

export type InvoiceType = 'personal' | 'company'
export type InvoiceProfileSource = 'manual' | 'verified'
export type InvoiceStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'issued'
  | 'cancelled'
export type RealNameStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'expired'

export interface InvoiceableTopUp {
  id: number
  user_id: number
  amount: number
  money: number
  trade_no: string
  payment_method: string
  payment_provider: string
  create_time: number
  complete_time: number
  status: string
}

export interface InvoiceRequestItem {
  id: number
  invoice_request_id: number
  topup_id: number
  trade_no: string
  money: number
  payment_provider: string
  payment_method: string
  topup_create_time: number
  topup_complete_time: number
  created_at: number
}

export interface InvoiceRequestRecord {
  id: number
  user_id: number
  username: string
  invoice_type: InvoiceType
  profile_source: InvoiceProfileSource
  realname_verification_id?: number | null
  title: string
  tax_no: string
  email: string
  phone: string
  amount: number
  currency: string
  status: InvoiceStatus
  remark: string
  reject_reason: string
  invoice_no: string
  invoice_url: string
  issue_note: string
  issued_at: number
  reviewed_by: number
  reviewed_at: number
  created_at: number
  updated_at: number
  items?: InvoiceRequestItem[]
}

export interface InvoiceProfile {
  id?: number
  user_id?: number
  invoice_type: InvoiceType
  source?: InvoiceProfileSource
  realname_verification_id?: number | null
  title: string
  tax_no: string
  email: string
  phone: string
  bank_name: string
  bank_account: string
  registered_address: string
  registered_phone: string
  is_default?: boolean
  created_at?: number
  updated_at?: number
}

export interface InvoiceProfiles {
  personal?: InvoiceProfile | null
  company?: InvoiceProfile | null
}

export interface RealNameVerification {
  id: number
  user_id: number
  verify_type: InvoiceType
  provider: string
  provider_request_id: string
  status: RealNameStatus
  verified_name: string
  company_name: string
  id_no_masked: string
  credit_code: string
  legal_person_name_masked: string
  provider_result_code: string
  provider_result_message: string
  started_at: number
  verified_at: number
  expired_at: number
  created_at: number
  updated_at: number
}

export type RealNameStatusMap = Record<
  InvoiceType,
  RealNameVerification | null
> & {
  realname_provider?: string
  realname_providers?: string[]
}

export interface RealNameSession {
  provider: string
  provider_request_id: string
  redirect_url: string
  qr_code_url: string
  metadata?: Record<string, unknown>
}

export interface CreateInvoicePayload {
  topup_ids: number[]
  invoice_type: InvoiceType
  title: string
  tax_no?: string
  email?: string
  phone?: string
  remark?: string
}

export interface UpdateInvoiceProfilePayload extends InvoiceProfile {}

export interface CreateRealNameSessionPayload {
  verify_type: InvoiceType
  provider?: string
}

export interface CreateRealNameSessionResponse {
  verification: RealNameVerification
  session: RealNameSession
}

export interface AdminIssueInvoicePayload {
  invoice_no: string
  invoice_url?: string
  issued_at?: number
  issue_note?: string
}
