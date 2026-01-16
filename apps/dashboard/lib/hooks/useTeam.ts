/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { useAgency } from './useAgency';
import type { TeamMember, CreateTeamMember, UpdateTeamMember, TeamRole } from '@/lib/types/team';

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 USE TEAM HOOK - Team members management
// ═══════════════════════════════════════════════════════════════════════════════

export function useTeam() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { agency } = useAgency();
    const supabase = createSupabaseClient();

    // Fetch team members
    const fetchMembers = useCallback(async () => {
        if (!agency) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('team_members')
                .select('*')
                .eq('agency_id', agency.id)
                .order('role', { ascending: true });

            if (fetchError) throw fetchError;
            setMembers(data as TeamMember[]);

            // Find current user's membership
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const current = (data as TeamMember[]).find(m => m.user_id === user.id);
                setCurrentMember(current || null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch team');
        } finally {
            setLoading(false);
        }
    }, [agency, supabase]);

    // Invite new member
    const inviteMember = async (email: string, role: TeamRole = 'member', name?: string) => {
        if (!agency) throw new Error('No agency');

        try {
            // Check if already a member
            const existing = members.find(m => m.email === email);
            if (existing) throw new Error('User is already a team member');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Create invitation token
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

            // Insert invitation
            const { error: inviteError } = await supabase
                .from('team_invitations')
                .insert({
                    agency_id: agency.id,
                    email,
                    role,
                    token,
                    invited_by: user.id,
                    expires_at: expiresAt.toISOString(),
                });

            if (inviteError) throw inviteError;

            // Also create a pending team member record
            const { data, error } = await supabase
                .from('team_members')
                .insert({
                    agency_id: agency.id,
                    user_id: user.id, // Temporary - will be updated when they accept
                    email,
                    name,
                    role,
                    status: 'invited',
                    invited_by: user.id,
                    invited_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            setMembers(prev => [...prev, data as TeamMember]);

            return { token, invitation: data };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to invite member');
            throw err;
        }
    };

    // Update member role
    const updateMember = async (id: string, updates: UpdateTeamMember) => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setMembers(prev => prev.map(m => m.id === id ? data as TeamMember : m));
            return data as TeamMember;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update member');
            throw err;
        }
    };

    // Remove member
    const removeMember = async (id: string) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMembers(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove member');
            throw err;
        }
    };

    useEffect(() => {
        if (agency) {
            fetchMembers();
        }
    }, [agency, fetchMembers]);

    // Computed values
    const isOwner = currentMember?.role === 'owner';
    const isAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';
    const canInvite = isAdmin;
    const canManageRoles = isAdmin;

    const stats = {
        total: members.length,
        owners: members.filter(m => m.role === 'owner').length,
        admins: members.filter(m => m.role === 'admin').length,
        members: members.filter(m => m.role === 'member').length,
        viewers: members.filter(m => m.role === 'viewer').length,
        pending: members.filter(m => m.status === 'invited').length,
    };

    return {
        members,
        currentMember,
        loading,
        error,
        stats,
        isOwner,
        isAdmin,
        canInvite,
        canManageRoles,
        inviteMember,
        updateMember,
        removeMember,
        refetch: fetchMembers,
    };
}
