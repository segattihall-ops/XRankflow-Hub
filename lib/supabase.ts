import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njwqeulzythluenexdcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XbmJA9m7lSEywUBMbsQdSw_gsna1jqq'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type FinanceRecord = {
  id: string
  org_id: string
  brand_id?: string | null
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
  brand_id?: string | null
  metric: string
  owner_role: string | null
  target: number | null
  actual: number | null
  health: 'On Track' | 'At Risk' | 'Off Track' | 'Not Started'
  period: 'Weekly' | 'Monthly' | string | null
  week_month?: string | null
  created_at: string
}

export type TaskRecord = {
  id: string
  org_id: string
  brand_id?: string | null
  project_id?: string | null
  title: string
  area: string | null
  owner_role: string | null
  priority: 'High' | 'Medium' | 'Low' | string | null
  status: 'Inbox' | 'Next' | 'In Progress' | 'Waiting' | 'Done' | 'Parked' | string
  notes: string | null
  due_date?: string | null
  created_at: string
}

export type ProjectRecord = {
  id: string
  org_id: string
  brand_id?: string | null
  name: string
  description: string | null
  status: string | null
  owner: string | null
  next_step: string | null
  created_at: string
}

export type PersonRecord = {
  id: string
  org_id: string
  name: string
  role: string | null
  status: string
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
  color?: string | null
  description?: string | null
  status?: string | null
  sort?: number | null
  created_at: string
}
