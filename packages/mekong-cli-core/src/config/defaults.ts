import type { MekongConfig } from '../types/config.js';

/** Default configuration values */
export const DEFAULT_CONFIG: MekongConfig = {
  version: '1',
  llm: {
    default_provider: 'anthropic',
    default_model: 'claude-sonnet-4-20250514',
    providers: {},
  },
  agents: {
    max_iterations: 10,
    max_tokens_per_turn: 4096,
    wip_limit: 3,
    timeout_seconds: 300,
  },
  budget: {
    max_cost_per_task: 1.0,
    max_tokens_per_task: 100000,
    warn_at_percent: 80,
  },
  tools: {
    auto_approve_level: '1',
    sandbox_shell: true,
    allowed_directories: ['./'],
    blocked_commands: ['rm -rf /', 'sudo'],
  },
  heartbeat: {
    enabled: false,
    interval_minutes: 30,
    checklist_file: 'HEARTBEAT.md',
    scheduled_sops: [],
  },
  memory: {
    session_dir: '~/.mekong/sessions',
    knowledge_dir: '~/.mekong/knowledge',
    max_session_size_mb: 10,
    auto_compact: true,
  },
  integrations: {
    stripe: { api_key_env: 'STRIPE_API_KEY', webhook_secret_env: 'STRIPE_WEBHOOK_SECRET' },
    email: { provider: 'none', api_key_env: 'EMAIL_API_KEY', from_address: 'noreply@example.com' },
    google_calendar: { enabled: false, credentials_env: 'GOOGLE_CREDENTIALS' },
    notifications: { slack_webhook_env: 'SLACK_WEBHOOK_URL', enabled: false },
  },
  crm: {
    data_dir: '~/.mekong/crm',
    sla_hours: 24,
    lead_scoring: { qualify_threshold: 60, auto_qualify: false },
  },
  finance: {
    data_dir: '~/.mekong/finance',
    currency: 'USD',
    tax_rate: 0,
    invoice_prefix: 'INV',
    company_name: 'My Company',
  },
  dashboard: {
    daily_standup: { enabled: false, time: '09:00' },
    weekly_digest: { enabled: false, day: 'monday', time: '08:00' },
  },
  license: {
    api_url: 'https://api.mekong.ai/v1',
    offline_grace_days: 7,
    background_check: true,
  },
};
