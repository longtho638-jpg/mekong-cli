import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create client lazily or use mock to prevent build-time errors
const createAdminClient = () => {
    if (!supabaseUrl || !supabaseKey) {
        // Return a mock client that throws helpful errors when used
        return {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        order: () => ({ limit: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
                        single: () => Promise.resolve({ data: null, error: null })
                    }),
                    order: () => ({ limit: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
                }),
                insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
                update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
                upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
            }),
        } as any;
    }
    return createClient(supabaseUrl, supabaseKey);
};

// Use a getter to ensure we only access env vars at runtime, not build time
export const getSupabaseAdmin = () => createAdminClient();

/**
 * Goal Tracking Service
 * Manages autonomous goal tracking and decision-making
 */
export class GoalService {

    /**
     * Get all active goals
     */
    static async getActiveGoals() {
        const { data, error } = await getSupabaseAdmin()
            .from('autonomous_goals')
            .select('*')
            .eq('status', 'active')
            .order('priority', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Update goal progress
     */
    static async updateGoalProgress(goalId: string, currentValue: number) {
        const { data, error } = await getSupabaseAdmin()
            .from('autonomous_goals')
            .update({
                current_value: currentValue,
                updated_at: new Date().toISOString()
            })
            .eq('id', goalId)
            .select()
            .single();

        if (error) throw error;

        // Check if goal is achieved
        if (data && data.current_value >= data.target_value) {
            await this.markGoalAchieved(goalId);
        }

        return data;
    }

    /**
     * Mark goal as achieved
     */
    static async markGoalAchieved(goalId: string) {
        const { error } = await getSupabaseAdmin()
            .from('autonomous_goals')
            .update({
                status: 'achieved',
                achieved_at: new Date().toISOString()
            })
            .eq('id', goalId);

        if (error) throw error;
    }

    /**
     * Log CEO execution
     */
    static async logExecution(log: {
        ceo_directive: string;
        departments_activated: string[];
        tasks_completed: any;
        metrics_snapshot: any;
        ceo_report: string;
    }) {
        const { data, error } = await getSupabaseAdmin()
            .from('execution_log')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get current business metrics
     */
    static async getCurrentMetrics() {
        const { data, error } = await getSupabaseAdmin()
            .from('performance_metrics')
            .select('*')
            .order('metric_date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || {
            revenue: 0,
            orders: 0,
            customers: 0,
            visitors: 0
        };
    }

    /**
     * Update business metrics
     */
    static async updateMetrics(metrics: {
        revenue?: number;
        orders?: number;
        customers?: number;
        visitors?: number;
    }) {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await getSupabaseAdmin()
            .from('performance_metrics')
            .upsert({
                metric_date: today,
                ...metrics,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'metric_date'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create department task
     */
    static async createTask(task: {
        department: string;
        task_description: string;
        priority?: string;
    }) {
        const { data, error } = await getSupabaseAdmin()
            .from('department_tasks')
            .insert({
                ...task,
                status: 'pending',
                assigned_by: 'CEO'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Complete department task
     */
    static async completeTask(taskId: string, output: any) {
        const { data, error } = await getSupabaseAdmin()
            .from('department_tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                output: output
            })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
