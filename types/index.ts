export interface User {
  id: string
  name: string
  email: string
  avatar: string
  department: string
  access: 'Full Access' | 'Edit Access' | 'Read Only' | 'Restricted'
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'Active' | 'On Hold' | 'Completed'
  progress: number
  owner: string
  startDate: string
  endDate: string
  risk: 'Low' | 'Medium' | 'High'
  brand?: string
}

export interface Task {
  id: string
  title: string
  status: 'Open' | 'Done' | 'Blocked'
  priority: 'Low' | 'Medium' | 'High'
  assignee: string
  dueDate: string
  project?: string
  brand?: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON' | 'CLOSED_LOST'
  value: number
  brand: string
}

export interface FinanceRecord {
  id: string
  date: string
  type: 'Revenue' | 'Cost' | 'Profit'
  amount: number
  category: string
  brand: string
  description: string
}

export interface Brand {
  id: string
  name: string
  code: string
  color: string
  description: string
  image: string
  stats: {
    tasks: number
    revenue: number
    profit: number
    contacts: number
  }
}

export interface ActivityLogEntry {
  id: string
  user: User
  action: string
  resource: string
  resourceType: 'Document' | 'Project' | 'Task' | 'Contact'
  timestamp: string
}

export interface Document {
  id: string
  title: string
  module: string
  type: string
  createdBy: string
  createdAt: string
  updatedAt: string
}
