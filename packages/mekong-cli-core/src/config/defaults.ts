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
  },
  memory: {
    session_dir: '~/.mekong/sessions',
    knowledge_dir: '~/.mekong/knowledge',
    max_session_size_mb: 10,
    auto_compact: true,
  },
};
