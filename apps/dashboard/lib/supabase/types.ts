// Agency OS Database Types
// Auto-generated from Supabase schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            agencies: {
                Row: {
                    id: string
                    user_id: string | null
                    name: string
                    email: string | null
                    website: string | null
                    niche: string | null
                    size: string | null
                    location: string | null
                    services: string[] | null
                    logo_url: string | null
                    subscription_tier: string
                    subscription_status: string
                    stripe_customer_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    name: string
                    email?: string | null
                    website?: string | null
                    niche?: string | null
                    size?: string | null
                    location?: string | null
                    services?: string[] | null
                    logo_url?: string | null
                    subscription_tier?: string
                    subscription_status?: string
                    stripe_customer_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    name?: string
                    email?: string | null
                    website?: string | null
                    niche?: string | null
                    size?: string | null
                    location?: string | null
                    services?: string[] | null
                    logo_url?: string | null
                    subscription_tier?: string
                    subscription_status?: string
                    stripe_customer_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    agency_id: string | null
                    name: string
                    email: string | null
                    phone: string | null
                    company: string | null
                    status: string
                    mrr: number
                    notes: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    agency_id?: string | null
                    name: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    status?: string
                    mrr?: number
                    notes?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    agency_id?: string | null
                    name?: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    status?: string
                    mrr?: number
                    notes?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    agency_id: string | null
                    client_id: string | null
                    name: string
                    description: string | null
                    status: string
                    type: string | null
                    budget: number | null
                    start_date: string | null
                    end_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    agency_id?: string | null
                    client_id?: string | null
                    name: string
                    description?: string | null
                    status?: string
                    type?: string | null
                    budget?: number | null
                    start_date?: string | null
                    end_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    agency_id?: string | null
                    client_id?: string | null
                    name?: string
                    description?: string | null
                    status?: string
                    type?: string | null
                    budget?: number | null
                    start_date?: string | null
                    end_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            invoices: {
                Row: {
                    id: string
                    agency_id: string | null
                    client_id: string | null
                    project_id: string | null
                    invoice_number: string
                    status: string
                    amount: number
                    tax: number
                    total: number
                    currency: string
                    issue_date: string
                    due_date: string | null
                    paid_date: string | null
                    notes: string | null
                    stripe_invoice_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    agency_id?: string | null
                    client_id?: string | null
                    project_id?: string | null
                    invoice_number: string
                    status?: string
                    amount: number
                    tax?: number
                    total: number
                    currency?: string
                    issue_date?: string
                    due_date?: string | null
                    paid_date?: string | null
                    notes?: string | null
                    stripe_invoice_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    agency_id?: string | null
                    client_id?: string | null
                    project_id?: string | null
                    invoice_number?: string
                    status?: string
                    amount?: number
                    tax?: number
                    total?: number
                    currency?: string
                    issue_date?: string
                    due_date?: string | null
                    paid_date?: string | null
                    notes?: string | null
                    stripe_invoice_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    agency_id: string | null
                    project_id: string | null
                    title: string
                    description: string | null
                    status: string
                    priority: string
                    due_date: string | null
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    agency_id?: string | null
                    project_id?: string | null
                    title: string
                    description?: string | null
                    status?: string
                    priority?: string
                    due_date?: string | null
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    agency_id?: string | null
                    project_id?: string | null
                    title?: string
                    description?: string | null
                    status?: string
                    priority?: string
                    due_date?: string | null
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            activity_logs: {
                Row: {
                    id: string
                    agency_id: string | null
                    user_id: string | null
                    action: string
                    entity_type: string | null
                    entity_id: string | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    agency_id?: string | null
                    user_id?: string | null
                    action: string
                    entity_type?: string | null
                    entity_id?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    agency_id?: string | null
                    user_id?: string | null
                    action?: string
                    entity_type?: string | null
                    entity_id?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Convenience types
export type Agency = Database['public']['Tables']['agencies']['Row']
export type AgencyInsert = Database['public']['Tables']['agencies']['Insert']
export type AgencyUpdate = Database['public']['Tables']['agencies']['Update']

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']

// Status enums
export type ClientStatus = 'active' | 'pending' | 'churned'
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'agency' | 'franchise'
