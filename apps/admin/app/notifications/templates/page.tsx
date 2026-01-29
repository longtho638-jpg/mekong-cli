'use client';

import React, { useState } from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3DataTable, MD3Chip, MD3Dialog, MD3TextField, MD3Select } from '@/components/md3';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit, Trash, Check, X } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    type: string;
    subject?: string;
    content: string;
    description?: string;
    active: boolean;
    updated_at: string;
    [key: string]: unknown;
}

export default function NotificationTemplatesPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'email',
        subject: '',
        content: '',
        description: '',
        active: true
    });

    const { data: templates, isLoading } = useQuery({
        queryKey: ['notification-templates'],
        queryFn: async () => {
            const res = await api.get('/api/v1/notifications/templates/');
            return res.data as Template[];
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: Omit<Template, 'id' | 'updated_at'>) => {
            await api.post('/api/v1/notifications/templates/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
            setIsCreateOpen(false);
            setFormData({
                name: '',
                type: 'email',
                subject: '',
                content: '',
                description: '',
                active: true
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/v1/notifications/templates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
        }
    });

    const handleSubmit = () => {
        createMutation.mutate(formData);
    };

    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (data: unknown) => {
                const row = data as Template;
                return (
                    <div className="font-medium text-gray-900">{row.name}</div>
                );
            }
        },
        {
            header: 'Type',
            accessor: 'type',
            render: (data: unknown) => {
                const row = data as Template;
                return (
                    <MD3Chip label={row.type} size="small" variant={row.type === 'email' ? 'input' : 'assist'} />
                );
            }
        },
        {
            header: 'Subject',
            accessor: 'subject',
            render: (data: unknown) => {
                const row = data as Template;
                return <span className="text-gray-500 truncate max-w-xs block">{row.subject || '-'}</span>;
            }
        },
        {
            header: 'Status',
            accessor: 'active',
            render: (data: unknown) => {
                const row = data as Template;
                return (
                    row.active ? <Check className="text-green-500" size={16} /> : <X className="text-red-500" size={16} />
                );
            }
        },
        {
            header: 'Last Updated',
            accessor: 'updated_at',
            render: (data: unknown) => {
                const row = data as Template;
                return row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '-';
            }
        },
        {
            header: 'Actions',
            accessor: 'id',
            render: (data: unknown) => {
                const row = data as Template;
                return (
                    <div className="flex gap-2">
                        <MD3Button variant="text" size="small" onClick={() => {}} startIcon={<Edit size={14} />}>Edit</MD3Button>
                        <MD3Button
                            variant="text"
                            size="small"
                            color="error"
                            onClick={() => {
                                if(confirm('Delete template?')) deleteMutation.mutate(row.id)
                            }}
                            startIcon={<Trash size={14} />}
                        >
                            Delete
                        </MD3Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Notification Templates</MD3Typography>
                    <MD3Typography variant="body-large" className="text-gray-500">Manage email and push templates</MD3Typography>
                </div>
                <MD3Button startIcon={<Plus size={18} />} onClick={() => setIsCreateOpen(true)}>Create Template</MD3Button>
            </div>

            <MD3Card variant="elevated" className="p-0 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">Loading templates...</div>
                ) : (
                    <MD3DataTable<Template>
                        columns={columns}
                        data={templates || []}
                    />
                )}
            </MD3Card>

            <MD3Dialog
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Notification Template"
                actions={
                    <>
                        <MD3Button variant="text" onClick={() => setIsCreateOpen(false)}>Cancel</MD3Button>
                        <MD3Button onClick={handleSubmit} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create'}
                        </MD3Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <MD3TextField
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., welcome_email"
                    />
                    <MD3Select
                        label="Type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        options={[
                            { value: 'email', label: 'Email' },
                            { value: 'push', label: 'Push Notification' },
                            { value: 'sms', label: 'SMS' }
                        ]}
                    />
                    <MD3TextField
                        label="Subject (Email only)"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Welcome to Mekong!"
                    />
                    <MD3TextField
                        label="Content (HTML/Text)"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        multiline
                        rows={6}
                        placeholder="<html><body>Hello {{name}}...</body></html>"
                    />
                     <MD3TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Sent when a user signs up"
                    />
                </div>
            </MD3Dialog>
        </div>
    );
}
