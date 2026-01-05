'use client';

import React, { useState } from 'react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface, MD3Text } from '@/components/md3-dna';
import { useTeam } from '@/lib/hooks/useTeam';
import { useAgency } from '@/lib/hooks/useAgency';
import {
    Users, UserPlus, Crown, Shield, User, Eye,
    Mail, MoreHorizontal, Trash2, X, Check, AlertCircle
} from 'lucide-react';
import type { TeamRole } from '@/lib/types/team';

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 TEAM MANAGEMENT - Multi-tenancy UI
// DNA: MD3AppShell + MD3SupportingPaneLayout + MD3Surface
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
    owner: <Crown className="w-4 h-4" />,
    admin: <Shield className="w-4 h-4" />,
    member: <User className="w-4 h-4" />,
    viewer: <Eye className="w-4 h-4" />,
};

const ROLE_COLORS: Record<TeamRole, string> = {
    owner: 'var(--md-sys-color-tertiary)',
    admin: 'var(--md-sys-color-primary)',
    member: 'var(--md-sys-color-secondary)',
    viewer: 'var(--md-sys-color-outline)',
};

export default function TeamPage({ params: { locale } }: { params: { locale: string } }) {
    const { agency } = useAgency();
    const {
        members,
        currentMember,
        loading,
        error,
        stats,
        isAdmin,
        canInvite,
        inviteMember,
        updateMember,
        removeMember,
    } = useTeam();

    const [showInviteModal, setShowInviteModal] = useState(false);

    return (
        <MD3AppShell title="Team Management" subtitle={agency?.name || 'Organization'}>
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* Stats Cards - Using gap-3 like KPIHeroGrid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard icon={<Users className="w-5 h-5" />} label="Total Members" value={stats.total} color="var(--md-sys-color-primary)" />
                            <StatCard icon={<Crown className="w-5 h-5" />} label="Owners" value={stats.owners} color="var(--md-sys-color-tertiary)" />
                            <StatCard icon={<Shield className="w-5 h-5" />} label="Admins" value={stats.admins} color="var(--md-sys-color-primary)" />
                            <StatCard icon={<Mail className="w-5 h-5" />} label="Pending" value={stats.pending} color="var(--md-sys-color-secondary)" />
                        </div>

                        {/* Team Members List */}
                        <MD3Card headline="Team Members">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                                        style={{ borderColor: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : error ? (
                                <div className="text-center py-8" style={{ color: 'var(--md-sys-color-error)' }}>
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p>{error}</p>
                                </div>
                            ) : members.length === 0 ? (
                                <div className="text-center py-8" style={{ color: 'var(--md-sys-color-outline)' }}>
                                    <Users className="w-8 h-8 mx-auto mb-2" />
                                    <p>No team members yet</p>
                                </div>
                            ) : (
                                <div className="flex flex-col" style={{ gap: '8px' }}>
                                    {members.map((member) => (
                                        <MemberRow
                                            key={member.id}
                                            member={member}
                                            isCurrentUser={member.id === currentMember?.id}
                                            canManage={isAdmin && member.role !== 'owner'}
                                            onUpdateRole={(role) => updateMember(member.id, { role })}
                                            onRemove={() => removeMember(member.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </MD3Card>

                        {/* Role Permissions Info */}
                        <MD3Card headline="Role Permissions">
                            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '12px' }}>
                                {(['owner', 'admin', 'member', 'viewer'] as TeamRole[]).map((role) => (
                                    <div key={role} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                        <div className="flex items-center mb-2" style={{ gap: '8px', color: ROLE_COLORS[role] }}>
                                            {ROLE_ICONS[role]}
                                            <span className="font-medium capitalize">{role}</span>
                                        </div>
                                        <ul className="text-xs space-y-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            {role === 'owner' && <><li>✓ Full access</li><li>✓ Billing</li><li>✓ Delete org</li></>}
                                            {role === 'admin' && <><li>✓ Invite members</li><li>✓ Manage roles</li><li>✓ All data</li></>}
                                            {role === 'member' && <><li>✓ Read/Write data</li><li>✗ No invites</li></>}
                                            {role === 'viewer' && <><li>✓ View only</li><li>✗ No edits</li></>}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        {/* Quick Actions */}
                        <MD3Card headline="Quick Actions">
                            <div className="flex flex-col" style={{ gap: '8px' }}>
                                {canInvite && (
                                    <button
                                        onClick={() => setShowInviteModal(true)}
                                        className="flex items-center w-full p-3 rounded-lg transition-all hover:opacity-80"
                                        style={{
                                            backgroundColor: 'var(--md-sys-color-primary)',
                                            color: 'var(--md-sys-color-on-primary)',
                                            gap: '12px',
                                        }}
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Invite Team Member</span>
                                    </button>
                                )}
                            </div>
                        </MD3Card>

                        {/* Your Role */}
                        <MD3Card headline="Your Role">
                            {currentMember ? (
                                <div className="flex items-center p-3 rounded-lg" style={{
                                    backgroundColor: 'var(--md-sys-color-surface-container)',
                                    gap: '12px',
                                }}>
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: `${ROLE_COLORS[currentMember.role]}20`, color: ROLE_COLORS[currentMember.role] }}
                                    >
                                        {ROLE_ICONS[currentMember.role]}
                                    </div>
                                    <div>
                                        <div className="font-medium capitalize" style={{ color: ROLE_COLORS[currentMember.role] }}>
                                            {currentMember.role}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            {currentMember.email}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--md-sys-color-outline)' }}>Not a team member</p>
                            )}
                        </MD3Card>

                        {/* Organization Info */}
                        <MD3Card headline="Organization">
                            <div className="flex flex-col" style={{ gap: '8px' }}>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Name</span>
                                    <span style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 500 }}>{agency?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Plan</span>
                                    <span style={{ color: 'var(--md-sys-color-tertiary)', fontWeight: 500 }}>{agency?.subscription_tier || 'Free'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Members</span>
                                    <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{stats.total}</span>
                                </div>
                            </div>
                        </MD3Card>
                    </>
                }
            />

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteModal
                    onClose={() => setShowInviteModal(false)}
                    onInvite={async (email, role, name) => {
                        await inviteMember(email, role, name);
                        setShowInviteModal(false);
                    }}
                />
            )}
        </MD3AppShell>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <MD3Surface shape="large" color="surface-container" interactive={true}>
            {/* Header Row - Icon + Label */}
            <div className="flex items-center gap-2 mb-3">
                <div
                    className="p-1.5 rounded-lg"
                    style={{
                        backgroundColor: 'var(--md-sys-color-primary-container)',
                        color,
                    }}
                >
                    {icon}
                </div>
                <MD3Text variant="label-small" color="on-surface-variant" transform="uppercase">
                    {label}
                </MD3Text>
            </div>

            {/* Value */}
            <MD3Text variant="headline-small" color="on-surface">
                {value}
            </MD3Text>

            {/* Pulse Indicator */}
            <div
                className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: color }}
            />
        </MD3Surface>
    );
}

function MemberRow({ member, isCurrentUser, canManage, onUpdateRole, onRemove }: {
    member: { id: string; name?: string; email: string; role: TeamRole; status: string };
    isCurrentUser: boolean;
    canManage: boolean;
    onUpdateRole: (role: TeamRole) => void;
    onRemove: () => void;
}) {
    const [showRoleMenu, setShowRoleMenu] = useState(false);

    return (
        <div
            className="flex items-center justify-between p-4 rounded-lg transition-all"
            style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                border: isCurrentUser ? `2px solid ${ROLE_COLORS[member.role]}` : 'none',
            }}
        >
            <div className="flex items-center" style={{ gap: '16px' }}>
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}
                >
                    {(member.name || member.email)?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="font-medium flex items-center" style={{ color: 'var(--md-sys-color-on-surface)', gap: '8px' }}>
                        {member.name || member.email}
                        {isCurrentUser && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>You</span>}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {member.email}
                    </div>
                </div>
            </div>
            <div className="flex items-center" style={{ gap: '12px' }}>
                {/* Role Badge */}
                <div
                    className="relative flex items-center px-3 py-1.5 rounded-full cursor-pointer"
                    style={{ backgroundColor: `${ROLE_COLORS[member.role]}20`, color: ROLE_COLORS[member.role], gap: '6px' }}
                    onClick={() => canManage && setShowRoleMenu(!showRoleMenu)}
                >
                    {ROLE_ICONS[member.role]}
                    <span className="text-sm font-medium capitalize">{member.role}</span>

                    {/* Role Dropdown */}
                    {showRoleMenu && canManage && (
                        <div
                            className="absolute top-full right-0 mt-2 py-2 rounded-lg shadow-lg z-10"
                            style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', minWidth: '120px' }}
                        >
                            {(['admin', 'member', 'viewer'] as TeamRole[]).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => { onUpdateRole(role); setShowRoleMenu(false); }}
                                    className="flex items-center w-full px-4 py-2 hover:opacity-80"
                                    style={{ gap: '8px', color: ROLE_COLORS[role] }}
                                >
                                    {ROLE_ICONS[role]}
                                    <span className="capitalize">{role}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Badge */}
                {member.status === 'invited' && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
                        Pending
                    </span>
                )}

                {/* Remove Button */}
                {canManage && !isCurrentUser && (
                    <button onClick={onRemove} className="p-2 rounded-lg hover:opacity-70" style={{ color: 'var(--md-sys-color-error)' }}>
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: TeamRole, name?: string) => Promise<void> }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<TeamRole>('member');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSaving(true);
        try {
            await onInvite(email, role, name || undefined);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div
                className="w-full max-w-md rounded-2xl p-6"
                style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Invite Team Member</h2>
                    <button onClick={onClose}><X className="w-5 h-5" style={{ color: 'var(--md-sys-color-outline)' }} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '16px' }}>
                    <div>
                        <label className="block text-sm mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg outline-none"
                            style={{
                                backgroundColor: 'var(--md-sys-color-surface-container)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                color: 'var(--md-sys-color-on-surface)',
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Name (optional)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg outline-none"
                            style={{
                                backgroundColor: 'var(--md-sys-color-surface-container)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                color: 'var(--md-sys-color-on-surface)',
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Role</label>
                        <div className="flex" style={{ gap: '8px' }}>
                            {(['admin', 'member', 'viewer'] as TeamRole[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className="flex-1 flex items-center justify-center py-2 rounded-lg transition-all"
                                    style={{
                                        backgroundColor: role === r ? ROLE_COLORS[r] : 'var(--md-sys-color-surface-container)',
                                        color: role === r ? 'white' : 'var(--md-sys-color-on-surface)',
                                        gap: '6px',
                                    }}
                                >
                                    {ROLE_ICONS[r]}
                                    <span className="capitalize text-sm">{r}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end" style={{ gap: '12px', marginTop: '8px' }}>
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !email}
                            className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                            style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
                        >
                            {saving ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
