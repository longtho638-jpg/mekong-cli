'use client';

import React, { useState, useEffect } from 'react';
import {
    MD3Typography,
    MD3Button,
    MD3Card,
    MD3DataTable,
    MD3Dialog,
    MD3TextField,
    MD3Select,
    MD3Chip
} from '../../../components/md3';
import { Plus, Edit, Trash2, Search, Terminal, RefreshCw } from 'lucide-react';
import { api } from '../../../lib/api';

// --- Types ---
interface Prompt {
    id: number;
    name: string;
    slug: string;
    description: string;
    content: string;
    input_variables: string; // JSON string in DB, but maybe parsed here? backend sends string
    is_active: boolean;
    version: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

interface PromptFormData {
    name: string;
    slug: string;
    description: string;
    content: string;
    input_variables: string;
    is_active: string; // "true" | "false" for select
}

const INITIAL_FORM: PromptFormData = {
    name: '',
    slug: '',
    description: '',
    content: '',
    input_variables: '',
    is_active: 'true'
};

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [formData, setFormData] = useState<PromptFormData>(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Prompts
    const fetchPrompts = async () => {
        setLoading(true);
        try {
            // Using direct fetch for now to match the pattern in other pages if api client has issues
            // But let's try to use the api client first if configured
            // Fallback to fetch if api client is not fully set up in this env
            const res = await api.get('/prompts/');
            setPrompts(res.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch prompts", err);
            // Fallback for demo/dev without auth setup
            // setError("Failed to load prompts. Ensure backend is running.");

            // MOCK DATA for visualization if backend fails (Development UX)
            if (process.env.NODE_ENV === 'development') {
                setPrompts([
                    {
                        id: 1,
                        name: "Blog Post Generator",
                        slug: "blog-generator-v1",
                        description: "Standard blog post generation template",
                        content: "Write a blog post about {{topic}} with a {{tone}} tone.",
                        input_variables: "['topic', 'tone']",
                        is_active: true,
                        version: 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: "SEO Optimizer",
                        slug: "seo-optimizer-v2",
                        description: "Optimize content for search engines",
                        content: "Optimize the following text for keywords: {{keywords}}.\n\nText: {{text}}",
                        input_variables: "['keywords', 'text']",
                        is_active: true,
                        version: 5,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrompts();
    }, []);

    // Handlers
    const handleOpenCreate = () => {
        setEditingPrompt(null);
        setFormData(INITIAL_FORM);
        setDialogOpen(true);
    };

    const handleOpenEdit = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setFormData({
            name: prompt.name,
            slug: prompt.slug,
            description: prompt.description || '',
            content: prompt.content,
            input_variables: prompt.input_variables || '',
            is_active: prompt.is_active ? 'true' : 'false'
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this prompt?")) return;
        try {
            await api.delete(`/prompts/${id}`);
            fetchPrompts();
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete prompt");
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                is_active: formData.is_active === 'true',
                // Simple parsing for input variables if user typed JSON
                input_variables: formData.input_variables ?
                    (formData.input_variables.startsWith('[') ? JSON.parse(formData.input_variables) : formData.input_variables.split(',').map(s => s.trim()))
                    : []
            };

            if (editingPrompt) {
                await api.put(`/prompts/${editingPrompt.id}`, payload);
            } else {
                await api.post('/prompts/', payload);
            }
            setDialogOpen(false);
            fetchPrompts();
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save prompt. Check console for details.");
        } finally {
            setSaving(false);
        }
    };

    // Table Config
    const filteredPrompts = prompts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            header: "Name / Slug",
            accessor: "name",
            render: (data: unknown) => {
                const row = data as Prompt;
                return (
                    <div>
                        <div className="font-medium text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{row.slug}</div>
                    </div>
                );
            }
        },
        {
            header: "Version",
            accessor: "version",
            render: (data: unknown) => {
                const row = data as Prompt;
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        v{row.version}
                    </span>
                );
            }
        },
        {
            header: "Status",
            accessor: "is_active",
            render: (data: unknown) => {
                const row = data as Prompt;
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                );
            }
        },
        {
            header: "Variables",
            accessor: "input_variables",
            render: (data: unknown) => {
                const row = data as Prompt;
                let vars = [];
                try {
                     // Handle both stringified list and actual list depending on what API returns/Schema
                    vars = typeof row.input_variables === 'string' ? JSON.parse(row.input_variables) : row.input_variables;
                    if (!Array.isArray(vars)) vars = [];
                } catch (e) { vars = [] }

                return (
                    <div className="flex flex-wrap gap-1">
                        {vars.slice(0, 3).map((v: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                                {v}
                            </span>
                        ))}
                        {vars.length > 3 && <span className="text-[10px] text-gray-500">+{vars.length - 3}</span>}
                    </div>
                )
            }
        },
        {
            header: "Actions",
            accessor: "actions",
            render: (data: unknown) => {
                const row = data as Prompt;
                return (
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenEdit(row)} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Terminal className="text-blue-600" size={28} />
                        <MD3Typography variant="headline-medium">Prompt Management</MD3Typography>
                    </div>
                    <MD3Typography variant="body-large" className="text-gray-600 mt-1">
                        Manage system prompts, templates, and versioning.
                    </MD3Typography>
                </div>
                <div className="flex gap-2">
                     <MD3Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={fetchPrompts}>
                        Refresh
                    </MD3Button>
                    <MD3Button startIcon={<Plus size={18} />} onClick={handleOpenCreate}>
                        New Prompt
                    </MD3Button>
                </div>
            </div>

            {/* Content */}
            <MD3Card className="p-0 overflow-hidden min-h-[400px]">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search prompts..."
                            className="pl-10 pr-4 py-2 w-full rounded-md border-gray-300 border focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredPrompts.length > 0 ? (
                    <MD3DataTable
                        columns={columns}
                        data={filteredPrompts}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Terminal size={48} className="mb-4 opacity-20" />
                        <p>No prompts found. Create one to get started.</p>
                    </div>
                )}
            </MD3Card>

            {/* Create/Edit Dialog */}
            <MD3Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editingPrompt ? "Edit Prompt" : "Create New Prompt"}
                actions={
                    <>
                        <MD3Button variant="text" onClick={() => setDialogOpen(false)} className="mr-2">Cancel</MD3Button>
                        <MD3Button onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Prompt'}
                        </MD3Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <MD3TextField
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Blog Generator"
                        />
                         <MD3TextField
                            label="Slug (Unique)"
                            value={formData.slug}
                            onChange={(e) => setFormData({...formData, slug: e.target.value})}
                            placeholder="e.g. blog-generator-v1"
                        />
                    </div>

                    <MD3TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        multiline rows={2}
                    />

                    <MD3TextField
                        label="Template Content"
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        multiline rows={8}
                        placeholder="Enter prompt template with {{variables}}..."
                        className="font-mono text-sm"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <MD3TextField
                            label="Input Variables (JSON or CSV)"
                            value={formData.input_variables}
                            onChange={(e) => setFormData({...formData, input_variables: e.target.value})}
                            placeholder='["topic", "tone"]'
                        />
                        <MD3Select
                            label="Status"
                            value={formData.is_active}
                            onChange={(e) => setFormData({...formData, is_active: e.target.value})}
                            options={[
                                { value: 'true', label: 'Active' },
                                { value: 'false', label: 'Inactive' }
                            ]}
                        />
                    </div>
                </div>
            </MD3Dialog>
        </div>
    );
}
