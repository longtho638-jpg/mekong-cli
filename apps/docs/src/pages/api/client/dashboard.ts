// API Endpoint: /api/client/dashboard
// Purpose: Retrieve client dashboard data by portal code
// Authentication: Portal code validation

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Supabase client (using environment variables)
const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || '',
    import.meta.env.SUPABASE_SERVICE_KEY || ''
);

export const GET: APIRoute = async ({ url }) => {
    try {
        // Extract portal code from query params
        // Note: Use Astro's url context, not request.url (which strips query params)
        const portalCode = url.searchParams.get('code');

        // Debug: Log the incoming request
        console.log('[DEBUG] Client Dashboard API called:', {
            url: url.href,
            portalCode: portalCode,
            searchParams: Object.fromEntries(url.searchParams)
        });

        if (!portalCode) {
            return new Response(
                JSON.stringify({
                    error: 'Missing portal code',
                    message: 'Please provide a valid portal code in the query parameter'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Validate portal code and fetch client
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('portal_code', portalCode)
            .eq('status', 'active')
            .single();

        if (clientError || !client) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid portal code',
                    message: 'Portal code not found or client inactive'
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Fetch projects for this client
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });

        if (projectsError) {
            console.error('Projects fetch error:', projectsError);
        }

        // Fetch tasks for all client projects
        const projectIds = projects?.map(p => p.id) || [];
        let tasks: any[] = [];

        if (projectIds.length > 0) {
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .in('project_id', projectIds)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!tasksError && tasksData) {
                tasks = tasksData;
            }
        }

        // Fetch invoices
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });

        if (invoicesError) {
            console.error('Invoices fetch error:', invoicesError);
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (messagesError) {
            console.error('Messages fetch error:', messagesError);
        }

        // Calculate stats
        const activeProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
        const totalPaid = invoices?.filter(i => i.status === 'paid')
            .reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
        const unreadMessages = messages?.filter(m => !m.read && m.sender === 'agency').length || 0;

        // Format projects with task counts
        const formattedProjects = projects?.map(project => {
            const projectTasks = tasks.filter(t => t.project_id === project.id);
            const tasksDone = projectTasks.filter(t => t.status === 'done').length;

            return {
                id: project.id,
                name: project.name,
                status: project.status,
                progress: project.progress,
                budget: project.budget,
                deadline: project.deadline,
                tasks_total: projectTasks.length,
                tasks_done: tasksDone
            };
        }) || [];

        // Build response
        const dashboardData = {
            client: {
                id: client.id,
                name: client.name,
                company: client.company,
                status: client.status,
                member_since: new Date(client.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                })
            },
            stats: {
                active_projects: activeProjects,
                completed_tasks: completedTasks,
                total_paid: totalPaid,
                unread_messages: unreadMessages
            },
            projects: formattedProjects,
            tasks: tasks.slice(0, 5).map(task => ({
                id: task.id,
                project_id: task.project_id,
                title: task.title,
                status: task.status,
                due_date: task.due_date
            })),
            invoices: invoices?.map(inv => ({
                id: inv.id,
                invoice_number: inv.invoice_number,
                amount: inv.amount,
                status: inv.status,
                paid_at: inv.paid_at,
                created_at: inv.created_at
            })) || [],
            messages: {
                unread_count: unreadMessages,
                recent: messages?.slice(0, 5) || []
            }
        };

        return new Response(
            JSON.stringify(dashboardData),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'private, max-age=30' // Cache for 30 seconds
                }
            }
        );

    } catch (error) {
        console.error('API Error:', error);

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: 'An unexpected error occurred'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
