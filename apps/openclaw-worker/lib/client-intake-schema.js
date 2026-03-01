'use strict';

/**
 * 📋 Client Intake Schema — 8 Mục Thu Thập Chuẩn Ngành
 * Validates intake data from clients before bootstrapping a new project.
 */

const INTAKE_SCHEMA = {
    company: {
        name: { type: 'string', required: true, label: 'Tên công ty / cá nhân' },
        industry: { type: 'enum', values: ['F&B', 'eCommerce', 'SaaS', 'Agency', 'Fintech', 'Education', 'Healthcare', 'Other'], required: true },
        size: { type: 'enum', values: ['Solo', '2-10', '10-50', '50+'], required: false, default: 'Solo' },
        website: { type: 'string', required: false, label: 'Website hiện tại' },
        contact: {
            name: { type: 'string', required: true },
            email: { type: 'string', required: true },
            phone: { type: 'string', required: false },
        }
    },
    project: {
        name: { type: 'string', required: true, label: 'Tên project (kebab-case)', pattern: /^[a-z0-9-]+$/ },
        type: { type: 'enum', values: ['Landing', 'eCommerce', 'SaaS', 'Dashboard', 'Mobile', 'API', 'Bot'], required: true },
        goal: { type: 'string', required: true, label: 'Mục tiêu dự án (1-2 câu)' },
        problems: { type: 'array', required: false, label: 'Vấn đề khách đang gặp' },
    },
    target: {
        audience: { type: 'string', required: true, label: 'Đối tượng sử dụng' },
        dailyUsers: { type: 'number', required: false, default: 100 },
        devices: { type: 'enum', values: ['mobile-first', 'desktop-first', 'both'], required: true, default: 'mobile-first' },
        locale: { type: 'enum', values: ['vi', 'en', 'both'], required: true, default: 'vi' },
    },
    features: {
        core: { type: 'array', required: true, label: 'Tính năng bắt buộc' },
        nice_to_have: { type: 'array', required: false, default: [] },
        integrations: { type: 'array', required: false, default: [], label: 'PayOS, Stripe, Supabase, Zalo, etc' },
    },
    design: {
        style: { type: 'enum', values: ['minimalist', 'glassmorphism', 'corporate', 'playful', 'dark', 'luxury'], required: false, default: 'minimalist' },
        primaryColor: { type: 'string', required: false, default: '#2563eb' },
        secondaryColor: { type: 'string', required: false, default: '#f59e0b' },
        references: { type: 'array', required: false, default: [], label: 'URL sites tham khảo' },
        logo: { type: 'string', required: false },
    },
    tech: {
        domain: { type: 'string', required: false },
        hosting: { type: 'enum', values: ['vercel', 'cloudflare', 'railway', 'custom'], required: false, default: 'vercel' },
        database: { type: 'enum', values: ['supabase', 'postgres', 'mysql', 'mongodb', 'none'], required: false, default: 'supabase' },
        auth: { type: 'enum', values: ['supabase-auth', 'clerk', 'better-auth', 'custom', 'none'], required: false, default: 'supabase-auth' },
        framework: { type: 'enum', values: ['nextjs', 'vite-react', 'astro', 'nuxt', 'python-fastapi'], required: false, default: 'nextjs' },
    },
    commercial: {
        budget: { type: 'string', required: false, label: 'VND or USD' },
        tier: { type: 'enum', values: ['starter', 'growth', 'premium', 'enterprise'], required: false, default: 'starter' },
        deadline: { type: 'string', required: false, label: 'ISO date or relative' },
        payment_method: { type: 'enum', values: ['bank-transfer', 'payos', 'stripe', 'polar'], required: false, default: 'bank-transfer' },
    },
    credentials: {
        domain_registrar: { type: 'string', required: false, sensitive: true },
        supabase_project_ref: { type: 'string', required: false, sensitive: true },
        payment_merchant_id: { type: 'string', required: false, sensitive: true },
        notes: { type: 'string', required: false },
    }
};

/**
 * Validate intake data against schema.
 * @param {object} data — raw intake JSON
 * @returns {{ valid: boolean, errors: string[], data: object }}
 */
function validateIntake(data) {
    const errors = [];

    // Check required fields
    if (!data.company?.name) errors.push('company.name is required');
    if (!data.company?.contact?.name) errors.push('company.contact.name is required');
    if (!data.company?.contact?.email) errors.push('company.contact.email is required');
    if (!data.company?.industry) errors.push('company.industry is required');
    if (!data.project?.name) errors.push('project.name is required');
    if (!data.project?.type) errors.push('project.type is required');
    if (!data.project?.goal) errors.push('project.goal is required');
    if (!data.target?.audience) errors.push('target.audience is required');
    if (!data.target?.devices) errors.push('target.devices is required');
    if (!data.features?.core || data.features.core.length === 0) errors.push('features.core must have at least 1 item');

    // Validate project name format
    if (data.project?.name && !/^[a-z0-9-]+$/.test(data.project.name)) {
        errors.push('project.name must be kebab-case (a-z, 0-9, hyphens only)');
    }

    // Apply defaults
    const filled = JSON.parse(JSON.stringify(data));
    filled.target = filled.target || {};
    filled.target.dailyUsers = filled.target.dailyUsers || 100;
    filled.target.devices = filled.target.devices || 'mobile-first';
    filled.target.locale = filled.target.locale || 'vi';
    filled.design = filled.design || {};
    filled.design.style = filled.design.style || 'minimalist';
    filled.design.primaryColor = filled.design.primaryColor || '#2563eb';
    filled.tech = filled.tech || {};
    filled.tech.hosting = filled.tech.hosting || 'vercel';
    filled.tech.database = filled.tech.database || 'supabase';
    filled.tech.auth = filled.tech.auth || 'supabase-auth';
    filled.tech.framework = filled.tech.framework || 'nextjs';
    filled.commercial = filled.commercial || {};
    filled.commercial.tier = filled.commercial.tier || 'starter';
    filled.features = filled.features || {};
    filled.features.nice_to_have = filled.features.nice_to_have || [];
    filled.features.integrations = filled.features.integrations || [];

    return { valid: errors.length === 0, errors, data: filled };
}

/**
 * Create a blank intake template for the client to fill out.
 * @returns {object} — empty intake object with all fields
 */
function createBlankIntake() {
    return {
        company: { name: '', industry: '', size: 'Solo', website: '', contact: { name: '', email: '', phone: '' } },
        project: { name: '', type: '', goal: '', problems: [] },
        target: { audience: '', dailyUsers: 100, devices: 'mobile-first', locale: 'vi' },
        features: { core: [], nice_to_have: [], integrations: [] },
        design: { style: 'minimalist', primaryColor: '#2563eb', secondaryColor: '#f59e0b', references: [], logo: '' },
        tech: { domain: '', hosting: 'vercel', database: 'supabase', auth: 'supabase-auth', framework: 'nextjs' },
        commercial: { budget: '', tier: 'starter', deadline: '', payment_method: 'bank-transfer' },
        credentials: { domain_registrar: '', supabase_project_ref: '', payment_merchant_id: '', notes: '' },
    };
}

module.exports = { INTAKE_SCHEMA, validateIntake, createBlankIntake };
