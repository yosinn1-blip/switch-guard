export type ServiceType = 'electricity' | 'gas' | 'internet' | 'insurance' | 'other';

export interface Contract {
  id: string;
  service_type: ServiceType;
  provider_name: string;
  contract_start: string;       // YYYY-MM-DD
  lock_in_months: number;
  monthly_amount?: number | null;
  contract_number?: string | null;
  notified_at?: string | null;
  snoozed_until?: string | null;
  memo?: string | null;
  created_at: string;
  unlock_date: string;          // generated column: YYYY-MM-DD
}

export interface ContractWithMeta extends Contract {
  days_until_unlock: number;    // Workers側で付与
}

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  WORKER_SECRET: string;
  NOTIFY_EMAIL: string;
  RESEND_API_KEY: string;
  APP_BASE_URL: string;
}
