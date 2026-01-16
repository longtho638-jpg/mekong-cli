/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
// ═══════════════════════════════════════════════════════════════════════════════
// 📦 HOOKS EXPORT
// Re-export all CRUD hooks for easy importing
// ═══════════════════════════════════════════════════════════════════════════════

export { useAgency } from './useAgency';
export { useClients } from './useClients';
export { useProjects } from './useProjects';
export { useInvoices } from './useInvoices';
export { useTeam } from './useTeam';
export { useAnalytics } from './useAnalytics';

// Types re-export
export type {
    Agency,
    Client,
    Project,
    Invoice,
    Task,
    ActivityLog,
    CreateClient,
    UpdateClient,
    CreateProject,
    UpdateProject,
    CreateInvoice,
    UpdateInvoice,
} from '@/lib/types/database';

export type {
    TeamMember,
    TeamInvitation,
    TeamRole,
    CreateTeamMember,
    UpdateTeamMember,
} from '@/lib/types/team';
