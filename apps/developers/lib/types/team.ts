 
// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MULTI-TENANCY TYPES
// Team members, roles, and invitations
// ═══════════════════════════════════════════════════════════════════════════════

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamMember {
    id: string;
    agency_id: string;
    user_id: string;
    role: TeamRole;
    email: string;
    name?: string;
    avatar_url?: string;
    status: 'active' | 'invited' | 'suspended';
    invited_by?: string;
    invited_at?: string;
    joined_at?: string;
    created_at: string;
    updated_at: string;
}

export interface TeamInvitation {
    id: string;
    agency_id: string;
    email: string;
    role: TeamRole;
    token: string;
    invited_by: string;
    expires_at: string;
    accepted_at?: string;
    created_at: string;
}

export type CreateTeamMember = Pick<TeamMember, 'email' | 'role' | 'name'>;
export type UpdateTeamMember = Partial<Pick<TeamMember, 'role' | 'name' | 'status'>>;

// Role permissions
export const ROLE_PERMISSIONS = {
    owner: ['read', 'write', 'delete', 'invite', 'manage_roles', 'billing', 'settings'],
    admin: ['read', 'write', 'delete', 'invite', 'manage_roles'],
    member: ['read', 'write'],
    viewer: ['read'],
} as const;

export type Permission = 'read' | 'write' | 'delete' | 'invite' | 'manage_roles' | 'billing' | 'settings';

export function hasPermission(role: TeamRole, permission: Permission): boolean {
    return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission);
}
