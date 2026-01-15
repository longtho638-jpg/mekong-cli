// ═══════════════════════════════════════════════════════════════════════════════
// 📊 AGENCY OS - DATA TYPES
// Matches Supabase schema from 20251219_init_schema.sql
// ═══════════════════════════════════════════════════════════════════════════════

export interface Agency {
    id: string;
    user_id: string;
    name: string;
    email?: string;
    website?: string;
    niche?: string;
    size?: string;
    location?: string;
    services?: string[];
    logo_url?: string;
    subscription_tier: 'free' | 'pro' | 'enterprise';
    subscription_status: 'active' | 'cancelled' | 'past_due';
    stripe_customer_id?: string;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    agency_id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status: 'active' | 'pending' | 'churned';
    mrr: number;
    notes?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    agency_id: string;
    client_id?: string;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    type?: 'retainer' | 'project' | 'hourly';
    budget?: number;
    start_date?: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    client?: Client;
}

export interface Invoice {
    id: string;
    agency_id: string;
    client_id?: string;
    project_id?: string;
    invoice_number: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    amount: number;
    tax: number;
    total: number;
    currency: string;
    issue_date: string;
    due_date?: string;
    paid_date?: string;
    notes?: string;
    stripe_invoice_id?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    client?: Client;
    project?: Project;
}

export interface Task {
    id: string;
    agency_id: string;
    project_id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    project?: Project;
}

export interface ActivityLog {
    id: string;
    agency_id: string;
    user_id?: string;
    action: string;
    entity_type?: 'client' | 'project' | 'invoice' | 'task';
    entity_id?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

// Create/Update DTOs (without id, timestamps)
export type CreateClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClient = Partial<CreateClient>;

export type CreateProject = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client'>;
export type UpdateProject = Partial<CreateProject>;

export type CreateInvoice = Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client' | 'project'>;
export type UpdateInvoice = Partial<CreateInvoice>;

export type CreateTask = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project'>;
export type UpdateTask = Partial<CreateTask>;
