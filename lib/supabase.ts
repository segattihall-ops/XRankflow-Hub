import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njwqeulzythluenexdcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XbmJA9m7lSEywUBMbsQdSw_gsna1jqq'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type FinanceRecord = {
  id: string
  org_id: string
  brand_id?: string
  item: string
  type: 'Subscription' | 'Expense' | 'Invoice' | 'Revenue' | 'Tax / Compliance'
  amount: number | null
  frequency: 'Monthly' | 'Yearly' | 'One-time'
  status: 'In progress' | 'Not started' | 'Done'
  notes: string | null
  created_at: string
}

export type KPIRecord = {
  id: string
  org_id: string
  metric: string
  owner_role: 'CEO' | 'SDR' | 'VA' | 'EA'
  target: number | null
  actual: number | null
  health: 'On Track' | 'At Risk' | 'Off Track' | 'Not Started'
  period: 'Weekly' | 'Monthly'
  created_at: string
}

export type TaskRecord = {
  id: string
  org_id: string
  brand_id?: string
  title: string
  area: string
  owner_role: 'CEO' | 'SDR' | 'VA' | 'Developer' | 'Designer' | 'Contractor'
  priority: 'High' | 'Medium' | 'Low'
  status: 'Inbox' | 'Next' | 'In Progress' | 'Waiting' | 'Done' | 'Parked'
  notes: string | null
  created_at: string
}

export type PersonRecord = {
  id: string
  org_id: string
  name: string
  role: 'CEO' | 'SDR' | 'VA' | 'EA' | 'Contractor'
  status: 'Active' | 'Onboarding' | 'Hiring' | 'Inactive'
  brand_focus: string | null
  contact: string | null
  responsibilities: string | null
  created_at: string
}

export type BrandRecord = {
  id: string
  org_id: string
  name: string
  slug: string
  code?: string
  color?: string
  description?: string
  image?: string
  created_at: string
}
