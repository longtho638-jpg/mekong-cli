'use client';

/**
 * Team Management Page
 * Enterprise team administration with roles and invitations
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Shield,
    MoreVertical,
    Mail,
    Check,
    X,
    Crown,
    User,
    Eye,
    Briefcase
} from 'lucide-react';
import { MD3Button } from '@/components/md3/MD3Button';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

// Types
type TenantRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: TenantRole;
    status: 'active' | 'pending' | 'suspended';
    joinedAt?: string;
    avatarUrl?: string;
}

// Role config
const ROLES: Record<TenantRole, { label: string; icon: typeof Crown; color: string }> = {
    owner: { label: 'Owner', icon: Crown, color: '#FFD700' },
    admin: { label: 'Admin', icon: Shield, color: '#6750A4' },
    manager: { label: 'Manager', icon: Briefcase, color: '#7D5260' },
    member: { label: 'Member', icon: User, color: '#625B71' },
    viewer: { label: 'Viewer', icon: Eye, color: '#938F99' },
};

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TenantRole>('member');

    useEffect(() => {
        // Mock data - in production, fetch from API
        setMembers([
            {
                id: '1',
                email: 'owner@agency.com',
                name: 'Anh Founder',
                role: 'owner',
                status: 'active',
                joinedAt: '2025-01-01',
            },
            {
                id: '2',
                email: 'admin@agency.com',
                name: 'Linh Admin',
                role: 'admin',
                status: 'active',
                joinedAt: '2025-02-15',
            },
            {
                id: '3',
                email: 'manager@agency.com',
                name: 'Hùng Manager',
                role: 'manager',
                status: 'active',
                joinedAt: '2025-03-10',
            },
            {
                id: '4',
                email: 'designer@agency.com',
                name: 'Mai Designer',
                role: 'member',
                status: 'active',
                joinedAt: '2025-04-20',
            },
            {
                id: '5',
                email: 'newbie@agency.com',
                name: '',
                role: 'member',
                status: 'pending',
            },
        ]);
        setLoading(false);
    }, []);

    const handleInvite = async () => {
        if (!inviteEmail) return;

        // Add pending member
        setMembers(prev => [...prev, {
            id: Date.now().toString(),
            email: inviteEmail,
            name: '',
            role: inviteRole,
            status: 'pending',
        }]);

        setInviteEmail('');
        setShowInviteModal(false);
    };

    const handleRemoveMember = (memberId: string) => {
        setMembers(prev => prev.filter(m => m.id !== memberId));
    };

    const handleChangeRole = (memberId: string, newRole: TenantRole) => {
        setMembers(prev => prev.map(m =>
            m.id === memberId ? { ...m, role: newRole } : m
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const activeMembers = members.filter(m => m.status === 'active');
    const pendingMembers = members.filter(m => m.status === 'pending');

    return (
        <div className="min-h-screen py-8 px-4 md:px-8" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-8 h-8" style={{ color: 'var(--md-sys-color-primary)' }} />
                            <h1
                                className="text-3xl font-bold"
                                style={{ color: 'var(--md-sys-color-on-surface)' }}
                            >
                                Team Management
                            </h1>
                        </div>
                        <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {activeMembers.length} active members • {pendingMembers.length} pending invitations
                        </p>
                    </div>

                    <MD3Button onClick={() => setShowInviteModal(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Member
                    </MD3Button>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Object.entries(ROLES).map(([role, config], index) => {
                        const count = members.filter(m => m.role === role && m.status === 'active').length;
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <MD3Surface color="surface-container" className="p-4 text-center">
                                    <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: config.color }} />
                                    <p className="text-2xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {count}
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        {config.label}s
                                    </p>
                                </MD3Surface>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Member List */}
                <MD3Card headline="Team Members">
                    <div className="divide-y mt-4" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                        {members.map((member, index) => {
                            const roleConfig = ROLES[member.role];
                            const RoleIcon = roleConfig.icon;

                            return (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="py-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                            style={{
                                                backgroundColor: member.status === 'pending'
                                                    ? 'var(--md-sys-color-outline)'
                                                    : roleConfig.color
                                            }}
                                        >
                                            {member.name ? member.name[0].toUpperCase() : '?'}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p
                                                    className="font-medium"
                                                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                                                >
                                                    {member.name || member.email}
                                                </p>
                                                {member.status === 'pending' && (
                                                    <span
                                                        className="text-xs px-2 py-0.5 rounded-full"
                                                        style={{
                                                            backgroundColor: 'var(--md-sys-color-secondary-container)',
                                                            color: 'var(--md-sys-color-on-secondary-container)',
                                                        }}
                                                    >
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                            <p
                                                className="text-sm"
                                                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                            >
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Role & Actions */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                                            style={{
                                                backgroundColor: `${roleConfig.color}20`,
                                                color: roleConfig.color,
                                            }}
                                        >
                                            <RoleIcon className="w-4 h-4" />
                                            {roleConfig.label}
                                        </div>

                                        {member.role !== 'owner' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="p-2 rounded-full hover:bg-red-50"
                                            >
                                                <X className="w-4 h-4 text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </MD3Card>

                {/* Invite Modal */}
                <AnimatePresence>
                    {showInviteModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowInviteModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-md rounded-3xl p-6"
                                style={{ backgroundColor: 'var(--md-sys-color-surface)' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <h2
                                    className="text-xl font-bold mb-4"
                                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                                >
                                    Invite Team Member
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="block text-sm mb-1"
                                            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                        >
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="colleague@company.com"
                                            className="w-full px-4 py-3 rounded-xl border-0"
                                            style={{
                                                backgroundColor: 'var(--md-sys-color-surface-container)',
                                                color: 'var(--md-sys-color-on-surface)',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="block text-sm mb-1"
                                            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                        >
                                            Role
                                        </label>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as TenantRole)}
                                            className="w-full px-4 py-3 rounded-xl border-0"
                                            style={{
                                                backgroundColor: 'var(--md-sys-color-surface-container)',
                                                color: 'var(--md-sys-color-on-surface)',
                                            }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="manager">Manager</option>
                                            <option value="member">Member</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <MD3Button
                                        variant="outlined"
                                        className="flex-1"
                                        onClick={() => setShowInviteModal(false)}
                                    >
                                        Cancel
                                    </MD3Button>
                                    <MD3Button
                                        className="flex-1"
                                        onClick={handleInvite}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Invite
                                    </MD3Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
