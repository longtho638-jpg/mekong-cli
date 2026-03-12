# MEKONG-CLI v0.3.0 IMPLEMENTATION SPEC
# Platform upgrade: Kaizen Analytics + Marketplace + Self-Improvement + MCP
# Biến mekong-cli từ "tool" thành "platform".
# QUAN TRỌNG: Giữ nguyên v0.1.0 + v0.2.0. Chỉ THÊM + EXTEND.

---

## 0. PREREQUISITE

v0.2.0 phải hoàn thành:
```bash
pnpm build && pnpm test
mekong dashboard        # phải show Andon board
mekong crm summary      # phải show CRM data
mekong finance revenue   # phải show revenue
mekong sop list          # phải show 15 templates
```

Nếu bất kỳ check nào fail → fix v0.2.0 trước. KHÔNG bắt đầu v0.3.0.

---

## 1. NEW DEPENDENCIES

```bash
pnpm add semver tar ignore ws simple-statistics
pnpm add -D @types/semver @types/tar @types/ws
```

Bump version:
```json
{ "version": "0.3.0" }
```

---

## 2. NEW DIRECTORY STRUCTURE

```
src/
  # ... giữ nguyên v0.1.0 + v0.2.0 ...

  # === MỚI v0.3.0 ===
  kaizen/
  │   ├── types.ts                    # Analytics types
  │   ├── collector.ts                # Metrics collection engine
  │   ├── analyzer.ts                 # Statistical analysis + bottleneck detection
  │   ├── recommender.ts              # AI-powered improvement suggestions
  │   ├── ab-testing.ts               # A/B test prompt variants
  │   └── report.ts                   # Kaizen report renderer
  │
  ├── marketplace/
  │   ├── types.ts                    # Marketplace types
  │   ├── registry.ts                 # Local SOP/plugin registry
  │   ├── packager.ts                 # Pack SOP into distributable .mkg format
  │   ├── publisher.ts                # Publish to marketplace (GitHub-based)
  │   ├── installer.ts                # Install from marketplace
  │   ├── discovery.ts                # Search and browse marketplace
  │   └── validator.ts                # Validate SOP packages
  │
  ├── plugins/
  │   ├── types.ts                    # Plugin system types
  │   ├── loader.ts                   # Plugin discovery and loading
  │   ├── sandbox.ts                  # Plugin sandboxing
  │   ├── api.ts                      # Plugin API surface
  │   └── hooks.ts                    # Lifecycle hooks for plugins
  │
  ├── mcp/
  │   ├── types.ts                    # MCP protocol types
  │   ├── client.ts                   # MCP client (stdio + SSE transports)
  │   ├── server-manager.ts           # Manage multiple MCP server connections
  │   ├── tool-adapter.ts             # Adapt MCP tools → mekong ToolDefinition
  │   └── discovery.ts                # Discover MCP servers
  │
  ├── self-improve/
  │   ├── types.ts                    # Self-improvement types
  │   ├── execution-feedback.ts       # Learn from success/failure patterns
  │   ├── skill-evolution.ts          # Auto-generate new skills from patterns
  │   ├── prompt-refiner.ts           # Optimize prompts via A/B testing
  │   └── memory-curator.ts           # Auto-clean and organize memory
  │
  ├── sops/templates/                 # THÊM vào folder có sẵn
  │   ├── kaizen-review.yaml          # NEW
  │   ├── marketplace-publish.yaml    # NEW
  │   ├── plugin-create.yaml          # NEW
  │   ├── self-audit.yaml             # NEW
  │   └── competitive-analysis.yaml   # NEW
  │
  └── cli/commands/                   # THÊM vào folder có sẵn
      ├── kaizen.ts                   # `mekong kaizen`
      ├── marketplace.ts              # `mekong marketplace`
      └── plugin.ts                   # `mekong plugin`
```

---

## 3. NEW TYPES

### 3.1 src/kaizen/types.ts
```typescript
import type { Id, Timestamp } from '../types/common.js';

/** Single metric data point */
export interface MetricPoint {
  timestamp: Timestamp;
  value: number;
  labels: Record<string, string>;    // e.g. { sop: "deploy", step: "build" }
}

/** Time series for a metric */
export interface MetricSeries {
  name: string;                      // e.g. "sop.deploy.duration"
  unit: 'ms' | 'seconds' | 'tokens' | 'usd' | 'count' | 'percent';
  points: MetricPoint[];
}

/** SOP execution analytics */
export interface SopAnalytics {
  sopName: string;
  totalRuns: number;
  successRate: number;               // 0-100
  avgDuration: number;               // seconds
  medianDuration: number;
  p95Duration: number;
  avgCost: number;                   // USD
  avgTokens: number;
  failureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  stepAnalytics: StepAnalytics[];
  trend: 'improving' | 'stable' | 'degrading';
  trendData: {
    durationTrend: number;           // percent change last 10 vs prev 10
    successTrend: number;
    costTrend: number;
  };
}

/** Per-step analytics within an SOP */
export interface StepAnalytics {
  stepId: string;
  stepName: string;
  avgDuration: number;
  medianDuration: number;
  successRate: number;
  isBottleneck: boolean;             // true if this step is slowest or most failing
  percentOfTotal: number;            // what % of total SOP time this step takes
  retryRate: number;                 // how often this step needs retry
  costContribution: number;          // what % of total SOP cost
}

/** Agent performance analytics */
export interface AgentAnalytics {
  agentName: string;
  totalTasks: number;
  successRate: number;
  avgTokensPerTask: number;
  avgCostPerTask: number;
  avgDuration: number;
  topTools: Array<{ tool: string; uses: number; successRate: number }>;
  failurePatterns: Array<{ pattern: string; count: number }>;
  efficiencyScore: number;           // 0-100 composite score
}

/** Bottleneck identification */
export interface Bottleneck {
  id: Id;
  type: 'sop_step' | 'agent' | 'tool' | 'llm_provider' | 'integration';
  location: string;                  // e.g. "deploy.build" or "coder agent"
  metric: string;                    // what metric is problematic
  currentValue: number;
  expectedValue: number;             // baseline or target
  impact: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Timestamp;
}

/** Improvement suggestion — from Kaizen engine */
export interface KaizenSuggestion {
  id: Id;
  type: 'parallelize' | 'cache' | 'tool_change' | 'model_downgrade' | 'sop_restructure' | 'skip_step' | 'batch' | 'prompt_optimize';
  title: string;
  description: string;
  target: string;                    // what SOP/step/agent this applies to
  evidence: string;                  // data that supports this suggestion
  estimatedImpact: {
    timeSaved: number;               // seconds per run
    costSaved: number;               // USD per run
    successRateChange: number;       // percentage points
  };
  autoApplicable: boolean;           // can mekong-cli apply this automatically?
  status: 'proposed' | 'approved' | 'applied' | 'rejected' | 'reverted';
  appliedAt?: Timestamp;
  createdAt: Timestamp;
}

/** Kaizen report — periodic improvement analysis */
export interface KaizenReport {
  period: { from: Timestamp; to: Timestamp };
  overallHealth: {
    score: number;                   // 0-100
    trend: 'improving' | 'stable' | 'degrading';
  };
  sopAnalytics: SopAnalytics[];
  agentAnalytics: AgentAnalytics[];
  bottlenecks: Bottleneck[];
  suggestions: KaizenSuggestion[];
  comparison: {
    totalSopRuns: { current: number; previous: number; change: number };
    avgSopDuration: { current: number; previous: number; change: number };
    totalCost: { current: number; previous: number; change: number };
    overallSuccessRate: { current: number; previous: number; change: number };
  };
}
```

### 3.2 src/marketplace/types.ts
```typescript
import type { Id, Timestamp } from '../types/common.js';

/** SOP package metadata — stored in package.json within .mkg archive */
export interface SopPackage {
  name: string;                      // unique: @author/sop-name
  version: string;                   // semver
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  license: string;
  category: string;
  tags: string[];
  mekongVersion: string;             // minimum mekong-cli version required
  dependencies: Record<string, string>;  // other SOP packages or tools
  files: string[];                   // files included in package
  repository?: string;               // git URL
  homepage?: string;
  readme?: string;
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;                  // USD, for paid
    trialRuns?: number;              // free runs before payment, for freemium
  };
}

/** Package manifest — the .mkg archive contains:
 *  /package.json    — SopPackage metadata
 *  /sop.yaml        — the SOP definition
 *  /agents/         — custom agent definitions (optional)
 *  /tools/          — custom tool definitions (optional)
 *  /templates/      — email/doc templates (optional)
 *  /README.md       — documentation
 */

/** Marketplace listing (what users see when browsing) */
export interface MarketplaceListing {
  package: SopPackage;
  stats: {
    downloads: number;
    stars: number;
    lastUpdated: Timestamp;
    reviews: number;
    avgRating: number;               // 1-5
  };
  verified: boolean;                 // verified by marketplace maintainers
  featured: boolean;
}

/** Local installed package record */
export interface InstalledPackage {
  package: SopPackage;
  installedAt: Timestamp;
  installPath: string;               // ~/.mekong/marketplace/packages/@author/name/
  enabled: boolean;
  runCount: number;
  lastRun?: Timestamp;
}

/** Marketplace search query */
export interface MarketplaceSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  pricing?: 'free' | 'paid' | 'all';
  sortBy?: 'downloads' | 'stars' | 'recent' | 'rating';
  limit?: number;
  offset?: number;
}

/** Marketplace config — where packages live */
export interface MarketplaceConfig {
  /** GitHub repo used as marketplace registry */
  registryRepo: string;             // default: "mekong-cli/marketplace"
  /** Local cache directory */
  cacheDir: string;                  // default: ~/.mekong/marketplace/cache
  /** Installed packages directory */
  packagesDir: string;               // default: ~/.mekong/marketplace/packages
  /** Auto-update check interval */
  updateCheckHours: number;          // default: 24
}
```

### 3.3 src/plugins/types.ts
```typescript
import type { Id, Timestamp } from '../types/common.js';
import type { ToolDefinition } from '../types/tool.js';
import type { AgentDefinition } from '../types/agent.js';

/** Plugin manifest — the entry point for a plugin */
export interface PluginManifest {
  name: string;                      // unique: @author/plugin-name
  version: string;
  description: string;
  author: string;
  mekongVersion: string;             // min compatible version
  
  /** What the plugin provides */
  provides: {
    tools?: string[];                // tool names this plugin registers
    agents?: string[];               // agent definitions
    sops?: string[];                 // SOP templates
    commands?: string[];             // CLI commands
    hooks?: string[];                // lifecycle hooks
    integrations?: string[];         // third-party integrations
  };

  /** What the plugin requires */
  requires: {
    integrations?: string[];         // e.g. ["stripe", "email"]
    tools?: string[];                // tools that must be available
    config?: string[];               // config keys that must be set
  };

  /** Entry point */
  main: string;                      // relative path to plugin entry
  
  /** Permission request — user must approve */
  permissions: PluginPermission[];
}

export type PluginPermission =
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network:outbound'
  | 'shell:execute'
  | 'llm:call'
  | 'integrations:access'
  | 'memory:read'
  | 'memory:write';

/** Plugin lifecycle hooks */
export interface PluginHooks {
  /** Called when plugin is loaded */
  onLoad?(): Promise<void>;
  /** Called before each SOP run */
  beforeSopRun?(sopName: string, inputs: Record<string, unknown>): Promise<void>;
  /** Called after each SOP run */
  afterSopRun?(sopName: string, result: unknown): Promise<void>;
  /** Called before each agent task */
  beforeAgentTask?(agentName: string, task: string): Promise<void>;
  /** Called after each agent task */
  afterAgentTask?(agentName: string, task: string, result: unknown): Promise<void>;
  /** Called before each tool execution */
  beforeToolCall?(toolName: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
  /** Called on heartbeat tick */
  onHeartbeat?(): Promise<void>;
  /** Called when plugin is unloaded */
  onUnload?(): Promise<void>;
}

/** Plugin API — what plugins can access */
export interface PluginApi {
  /** Register a new tool */
  registerTool(tool: ToolDefinition): void;
  /** Register a new agent definition */
  registerAgent(agent: AgentDefinition): void;
  /** Access config (read-only) */
  getConfig(): Record<string, unknown>;
  /** Access memory */
  readMemory(key: string): Promise<unknown>;
  writeMemory(key: string, value: unknown): Promise<void>;
  /** Emit custom events */
  emit(event: string, data?: unknown): void;
  /** Listen to events */
  on(event: string, handler: (data?: unknown) => void): void;
  /** Call LLM */
  callLlm(prompt: string, options?: { model?: string; maxTokens?: number }): Promise<string>;
  /** Log */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void;
}

/** Runtime plugin instance */
export interface PluginInstance {
  manifest: PluginManifest;
  hooks: PluginHooks;
  enabled: boolean;
  loadedAt: Timestamp;
  errors: string[];
}
```

### 3.4 src/mcp/types.ts
```typescript
/**
 * Model Context Protocol (MCP) types.
 * Based on: https://modelcontextprotocol.io/specification
 */

/** MCP Server connection config */
export interface McpServerConfig {
  name: string;
  transport: 'stdio' | 'sse';
  /** For stdio: command + args */
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  /** For SSE: URL */
  url?: string;
  /** Optional auth */
  headers?: Record<string, string>;
}

/** MCP Tool (from server's tools/list response) */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}

/** MCP Resource (from server's resources/list response) */
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** MCP Prompt (from server's prompts/list response) */
export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/** MCP call result */
export interface McpCallResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;        // base64 for image
    mimeType?: string;
    resource?: McpResource;
  }>;
  isError?: boolean;
}

/** Connected MCP server state */
export interface McpServerState {
  config: McpServerConfig;
  connected: boolean;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
  lastPing?: string;
  error?: string;
}
```

### 3.5 src/self-improve/types.ts
```typescript
import type { Id, Timestamp } from '../types/common.js';

/** Execution record — input for learning */
export interface ExecutionRecord {
  id: Id;
  taskType: string;                  // SOP name or "freeform"
  agentName: string;
  input: string;                     // original user input / task description
  toolsCalled: Array<{
    tool: string;
    params: Record<string, unknown>;
    success: boolean;
    duration: number;
    retries: number;
  }>;
  llmCalls: Array<{
    model: string;
    provider: string;
    promptHash: string;              // hash of system+user prompt
    inputTokens: number;
    outputTokens: number;
    success: boolean;
    duration: number;
  }>;
  result: 'success' | 'partial' | 'failure';
  errorType?: string;
  totalDuration: number;
  totalCost: number;
  totalTokens: number;
  timestamp: Timestamp;
}

/** Learned pattern — discovered from execution history */
export interface LearnedPattern {
  id: Id;
  type: 'success_pattern' | 'failure_pattern' | 'optimization' | 'new_skill';
  description: string;
  frequency: number;                 // how many times observed
  confidence: number;                // 0-1
  source: string;                    // what data it was learned from
  actionable: boolean;
  action?: string;                   // what to do about this pattern
  createdAt: Timestamp;
  lastSeen: Timestamp;
}

/** Prompt variant for A/B testing */
export interface PromptVariant {
  id: Id;
  name: string;                      // e.g. "deploy-system-prompt-v2"
  targetContext: string;             // what SOP/agent/task this prompt is for
  promptText: string;
  metrics: {
    uses: number;
    successRate: number;
    avgTokens: number;
    avgDuration: number;
    avgCost: number;
  };
  isActive: boolean;
  createdAt: Timestamp;
}

/** Learned skill — auto-generated from patterns */
export interface LearnedSkill {
  id: Id;
  name: string;
  description: string;
  trigger: string;                   // when to suggest using this skill
  implementation: {
    type: 'sop' | 'tool' | 'prompt';
    definition: string;              // YAML for SOP, code for tool, text for prompt
  };
  source: string;                    // what patterns led to this skill
  usageCount: number;
  successRate: number;
  status: 'proposed' | 'approved' | 'active' | 'retired';
  createdAt: Timestamp;
}
```

---

## 4. KAIZEN ANALYTICS ENGINE

### 4.1 src/kaizen/collector.ts
```typescript
/**
 * Metrics Collector — gathers data from all modules into unified time series.
 *
 * Data sources:
 * - SOP execution logs (from src/sops/metrics.ts)
 * - Agent task logs (from session memory)
 * - Tool call logs (from tool registry)
 * - LLM usage (from cost tracker)
 * - CRM activity (from crm store)
 * - Financial data (from finance store)
 * - Integration health (from integration registry)
 *
 * Storage: ~/.mekong/kaizen/metrics.jsonl (append-only, rotated monthly)
 *
 * Collection runs:
 * - Real-time: SOP/agent/tool events via event bus
 * - Periodic: financial + CRM summaries via heartbeat
 */

import type { MetricPoint, MetricSeries } from './types.js';
import type { Result } from '../types/common.js';

export class MetricsCollector {
  private buffer: MetricPoint[] = [];
  private flushInterval: number = 60000;    // flush to disk every 60s
  private metricsPath: string;

  constructor(metricsDir: string) {
    this.metricsPath = `${metricsDir}/metrics.jsonl`;
  }

  /** Record a single metric point */
  record(name: string, value: number, unit: string, labels: Record<string, string> = {}): void {
    this.buffer.push({
      timestamp: new Date().toISOString(),
      value,
      labels: { metric: name, unit, ...labels },
    });
    if (this.buffer.length >= 100) this.flush();
  }

  /** Convenience: record SOP step completion */
  recordSopStep(sopName: string, stepId: string, duration: number, success: boolean, cost: number): void {
    this.record('sop.step.duration', duration, 'ms', { sop: sopName, step: stepId });
    this.record('sop.step.success', success ? 1 : 0, 'count', { sop: sopName, step: stepId });
    this.record('sop.step.cost', cost, 'usd', { sop: sopName, step: stepId });
  }

  /** Convenience: record agent task completion */
  recordAgentTask(agent: string, duration: number, tokens: number, cost: number, success: boolean): void {
    this.record('agent.task.duration', duration, 'ms', { agent });
    this.record('agent.task.tokens', tokens, 'tokens', { agent });
    this.record('agent.task.cost', cost, 'usd', { agent });
    this.record('agent.task.success', success ? 1 : 0, 'count', { agent });
  }

  /** Convenience: record tool call */
  recordToolCall(tool: string, duration: number, success: boolean): void {
    this.record('tool.call.duration', duration, 'ms', { tool });
    this.record('tool.call.success', success ? 1 : 0, 'count', { tool });
  }

  /** Query metrics for a time range */
  async query(name: string, from: string, to: string, labels?: Record<string, string>): Promise<MetricSeries> {
    // Read from JSONL, filter by name + time + labels
    throw new Error('Not implemented');
  }

  /** Flush buffer to disk */
  async flush(): Promise<void> {
    // Append buffer to JSONL file
    // Clear buffer
    throw new Error('Not implemented');
  }

  /** Rotate old metrics (keep last 90 days) */
  async rotate(): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Subscribe to real-time events from event bus */
  subscribeToEvents(): void {
    // Listen to: sop:step_completed, agent:completed, tool:result, budget:*
    // Auto-record metrics for each event
    throw new Error('Not implemented');
  }
}
```

### 4.2 src/kaizen/analyzer.ts
```typescript
/**
 * Statistical Analyzer — finds bottlenecks, trends, and anomalies.
 *
 * Analysis types:
 * 1. SOP Performance: duration trends, success rates, cost efficiency
 * 2. Step Bottlenecks: which steps consume most time/cost/failures
 * 3. Agent Efficiency: which agents are most/least effective
 * 4. Tool Reliability: which tools fail most often
 * 5. Cost Optimization: where money is being wasted
 * 6. Trend Detection: is overall performance improving or degrading?
 *
 * Uses simple-statistics for:
 * - Mean, median, percentiles (p50, p95, p99)
 * - Standard deviation (anomaly detection)
 * - Linear regression (trend detection)
 * - Correlation (find related metrics)
 */

import { mean, median, standardDeviation, linearRegression, percentile } from 'simple-statistics';
import type { SopAnalytics, StepAnalytics, AgentAnalytics, Bottleneck, MetricSeries } from './types.js';
import type { MetricsCollector } from './collector.js';

export class KaizenAnalyzer {
  constructor(private collector: MetricsCollector) {}

  /** Analyze SOP performance over a period */
  async analyzeSop(sopName: string, days: number): Promise<SopAnalytics> {
    // 1. Query all metrics for this SOP in time range
    // 2. Calculate overall stats: avg, median, p95, success rate
    // 3. Per-step breakdown: find bottleneck step
    // 4. Trend: compare last N runs vs previous N runs
    // 5. Failure analysis: group failures by reason
    throw new Error('Not implemented');
  }

  /** Analyze agent performance */
  async analyzeAgent(agentName: string, days: number): Promise<AgentAnalytics> {
    // Similar to SOP analysis but agent-focused
    throw new Error('Not implemented');
  }

  /** Find all bottlenecks across the system */
  async findBottlenecks(days: number): Promise<Bottleneck[]> {
    // 1. Analyze all SOPs — find slowest steps
    // 2. Analyze all agents — find least efficient
    // 3. Analyze all tools — find highest failure rates
    // 4. Check LLM costs — find most expensive patterns
    // 5. Rank by impact
    throw new Error('Not implemented');
  }

  /** Detect anomalies (sudden changes from baseline) */
  async detectAnomalies(metric: string, days: number): Promise<Array<{
    timestamp: string;
    value: number;
    expected: number;
    deviation: number;      // number of standard deviations from mean
    severity: 'low' | 'medium' | 'high';
  }>> {
    // 1. Calculate rolling mean + stddev
    // 2. Flag points > 2 stddev from mean
    throw new Error('Not implemented');
  }

  /** Calculate system-wide health score (0-100) */
  async calculateHealthScore(days: number): Promise<{
    score: number;
    components: Record<string, number>;   // per-area scores
    trend: 'improving' | 'stable' | 'degrading';
  }> {
    // Weighted average of:
    // - SOP success rate (30%)
    // - Average cost efficiency (20%)
    // - Response time performance (20%)
    // - Agent success rate (15%)
    // - Tool reliability (15%)
    throw new Error('Not implemented');
  }
}
```

### 4.3 src/kaizen/recommender.ts
```typescript
/**
 * AI-Powered Improvement Recommender.
 *
 * Takes analysis results from KaizenAnalyzer and generates
 * actionable improvement suggestions.
 *
 * Recommendation types:
 * - parallelize: steps that can run concurrently
 * - cache: results that don't change often
 * - tool_change: switch to a faster/cheaper tool
 * - model_downgrade: use cheaper LLM for simple tasks
 * - sop_restructure: reorder/merge/split steps
 * - skip_step: steps that never fail and add little value
 * - batch: operations that can be batched
 * - prompt_optimize: prompts that use too many tokens
 *
 * Some suggestions are AUTO-APPLICABLE:
 * - model_downgrade: automatically route to cheaper model
 * - cache: add caching layer for stable results
 * - prompt_optimize: use shorter prompt variant
 *
 * Others require user approval:
 * - sop_restructure: changes workflow logic
 * - skip_step: removes quality gates
 * - parallelize: may change execution semantics
 */

import type { KaizenSuggestion, Bottleneck, SopAnalytics, AgentAnalytics } from './types.js';
import type { LlmRouter } from '../llm/router.js';
import type { Result } from '../types/common.js';

export class KaizenRecommender {
  constructor(private llm: LlmRouter) {}

  /** Generate suggestions from analysis results */
  async suggest(input: {
    sopAnalytics: SopAnalytics[];
    agentAnalytics: AgentAnalytics[];
    bottlenecks: Bottleneck[];
    budgetData: { totalSpent: number; byModel: Record<string, number> };
  }): Promise<KaizenSuggestion[]> {
    const suggestions: KaizenSuggestion[] = [];

    // Rule-based suggestions (no LLM needed):
    // 1. If step takes >50% of SOP time → suggest parallelize or optimize
    // 2. If step success rate is 100% and retryRate is 0 → suggest skip if non-critical
    // 3. If agent uses expensive model for simple tasks → suggest model_downgrade
    // 4. If same tool called >3 times in sequence → suggest batch
    // 5. If prompt uses >2000 tokens for <100 token output → suggest prompt_optimize

    // AI-powered suggestions (call LLM for complex analysis):
    // 6. Analyze failure patterns → suggest preventive measures
    // 7. Compare with best practices → suggest structural improvements

    throw new Error('Not implemented');
  }

  /** Apply a suggestion automatically (for auto-applicable ones) */
  async apply(suggestion: KaizenSuggestion): Promise<Result<void>> {
    // model_downgrade → update agent config to use cheaper model
    // cache → add caching wrapper to tool
    // prompt_optimize → activate shorter prompt variant
    throw new Error('Not implemented');
  }

  /** Revert an applied suggestion */
  async revert(suggestionId: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }
}
```

### 4.4 src/kaizen/report.ts
```typescript
/**
 * Kaizen Report Generator — periodic improvement analysis.
 *
 * Report types:
 * - Quick: bottlenecks + top suggestions (1 minute)
 * - Standard: full analytics for all SOPs/agents (5 minutes)
 * - Deep: AI-powered analysis with historical comparison (10 minutes)
 *
 * Output: CLI, Markdown, JSON
 */

import type { KaizenReport } from './types.js';
import type { KaizenAnalyzer } from './analyzer.js';
import type { KaizenRecommender } from './recommender.js';
import type { Result } from '../types/common.js';

export class KaizenReporter {
  constructor(
    private analyzer: KaizenAnalyzer,
    private recommender: KaizenRecommender,
  ) {}

  /** Generate full Kaizen report */
  async generate(options: {
    depth: 'quick' | 'standard' | 'deep';
    days: number;
  }): Promise<Result<KaizenReport>> {
    throw new Error('Not implemented');
  }

  /** Render as CLI output */
  renderCli(report: KaizenReport): string {
    // Sections:
    // 1. Overall Health: score + trend emoji
    // 2. Top Bottlenecks: table with location, metric, impact
    // 3. Period Comparison: this vs last period
    // 4. Top Suggestions: numbered list with estimated impact
    // 5. SOP Leaderboard: fastest, slowest, most reliable, least reliable
    throw new Error('Not implemented');
  }

  /** Render as Markdown */
  renderMarkdown(report: KaizenReport): string {
    throw new Error('Not implemented');
  }
}
```

---

## 5. SOP MARKETPLACE

### 5.1 src/marketplace/packager.ts
```typescript
/**
 * SOP Package Builder — packs SOP + dependencies into .mkg archive.
 *
 * .mkg format: tar.gz with structure:
 *   package.json    — metadata (SopPackage)
 *   sop.yaml        — main SOP definition
 *   agents/         — custom agent definitions (optional)
 *   tools/          — custom tool scripts (optional)
 *   templates/      — email/doc templates (optional)
 *   README.md       — documentation
 *
 * Validation before packing:
 * - SOP YAML must be valid (parse with Zod)
 * - package.json must have all required fields
 * - All referenced agents/tools must exist in package
 * - No absolute paths in any file
 * - No secrets/credentials in any file
 */

import type { SopPackage } from './types.js';
import type { Result } from '../types/common.js';

export class SopPackager {
  /** Pack a directory into .mkg file */
  async pack(sourceDir: string, outputPath: string): Promise<Result<{ path: string; size: number }>> {
    // 1. Read and validate package.json
    // 2. Read and validate sop.yaml
    // 3. Scan for secrets (reject if found)
    // 4. Collect all referenced files
    // 5. Create tar.gz
    throw new Error('Not implemented');
  }

  /** Unpack .mkg file to directory */
  async unpack(mkg: string, targetDir: string): Promise<Result<SopPackage>> {
    // 1. Extract tar.gz
    // 2. Read package.json
    // 3. Validate structure
    throw new Error('Not implemented');
  }

  /** Validate a package directory before packing */
  async validate(sourceDir: string): Promise<Result<{ warnings: string[]; errors: string[] }>> {
    throw new Error('Not implemented');
  }

  /** Scan files for secrets (API keys, passwords, tokens) */
  private scanForSecrets(filePath: string): string[] {
    // Regex patterns for common secret formats
    // Return list of findings
    throw new Error('Not implemented');
  }
}
```

### 5.2 src/marketplace/publisher.ts
```typescript
/**
 * Marketplace Publisher — publish SOP packages to GitHub-based registry.
 *
 * Registry structure (GitHub repo):
 *   registry/
 *     index.json             — master index of all packages
 *     @author/
 *       sop-name/
 *         metadata.json      — latest version metadata
 *         versions/
 *           1.0.0.mkg       — package archive
 *           1.1.0.mkg
 *
 * Publishing flow:
 * 1. Validate package locally
 * 2. Check version doesn't exist
 * 3. Upload .mkg to registry repo (via GitHub API)
 * 4. Update index.json
 *
 * For v0.3.0: GitHub releases as storage (free, no server needed)
 * Future: dedicated registry server with npm-like experience
 */

import type { SopPackage, MarketplaceListing } from './types.js';
import type { Result } from '../types/common.js';

export class MarketplacePublisher {
  private registryRepo: string;
  private githubToken?: string;

  constructor(config: { registryRepo: string; githubTokenEnv?: string }) {
    this.registryRepo = config.registryRepo;
    this.githubToken = config.githubTokenEnv
      ? process.env[config.githubTokenEnv]
      : undefined;
  }

  /** Publish package to marketplace */
  async publish(mkg: string): Promise<Result<{ url: string }>> {
    // 1. Unpack and validate
    // 2. Check if version exists (reject if so)
    // 3. Create GitHub release with .mkg as asset
    // 4. Update registry index
    throw new Error('Not implemented');
  }

  /** Unpublish a version */
  async unpublish(packageName: string, version: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }
}
```

### 5.3 src/marketplace/installer.ts
```typescript
/**
 * Marketplace Installer — download, install, update SOP packages.
 *
 * Install flow:
 * 1. Resolve package name → registry URL
 * 2. Download .mkg to cache
 * 3. Validate package
 * 4. Unpack to packages dir
 * 5. Register SOP with local registry
 * 6. Install dependencies if any
 *
 * Installed packages are available via `mekong sop list` and `mekong sop run`
 */

import type { SopPackage, InstalledPackage } from './types.js';
import type { Result } from '../types/common.js';

export class MarketplaceInstaller {
  constructor(
    private cacheDir: string,
    private packagesDir: string,
    private registryRepo: string,
  ) {}

  /** Install a package from marketplace */
  async install(packageName: string, version?: string): Promise<Result<InstalledPackage>> {
    // 1. Resolve latest version if not specified
    // 2. Check if already installed
    // 3. Download .mkg to cache
    // 4. Validate
    // 5. Unpack to packagesDir
    // 6. Register with local registry
    // 7. Install dependencies
    throw new Error('Not implemented');
  }

  /** Update installed package to latest */
  async update(packageName: string): Promise<Result<InstalledPackage>> {
    throw new Error('Not implemented');
  }

  /** Uninstall package */
  async uninstall(packageName: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  /** List installed packages */
  async listInstalled(): Promise<InstalledPackage[]> {
    throw new Error('Not implemented');
  }

  /** Check for available updates */
  async checkUpdates(): Promise<Array<{ package: string; current: string; latest: string }>> {
    throw new Error('Not implemented');
  }
}
```

### 5.4 src/marketplace/discovery.ts
```typescript
/**
 * Marketplace Discovery — search, browse, and explore SOPs.
 *
 * Search sources:
 * - GitHub registry index.json (primary)
 * - GitHub search API (for discovering unlisted packages)
 * - Local cache (offline search)
 */

import type { MarketplaceListing, MarketplaceSearchQuery } from './types.js';
import type { Result } from '../types/common.js';

export class MarketplaceDiscovery {
  constructor(private registryRepo: string, private cacheDir: string) {}

  /** Search marketplace */
  async search(query: MarketplaceSearchQuery): Promise<Result<MarketplaceListing[]>> {
    throw new Error('Not implemented');
  }

  /** Get package details */
  async getPackageInfo(packageName: string): Promise<Result<MarketplaceListing>> {
    throw new Error('Not implemented');
  }

  /** Get featured packages */
  async getFeatured(): Promise<Result<MarketplaceListing[]>> {
    throw new Error('Not implemented');
  }

  /** Get categories */
  async getCategories(): Promise<string[]> {
    return ['devops', 'development', 'business', 'finance', 'marketing', 'sales', 'support', 'analytics', 'automation', 'other'];
  }

  /** Sync registry index to local cache */
  async syncIndex(): Promise<Result<{ totalPackages: number }>> {
    throw new Error('Not implemented');
  }
}
```

---

## 6. MCP FULL IMPLEMENTATION

### 6.1 src/mcp/client.ts
```typescript
/**
 * MCP Client — connects to MCP servers via stdio or SSE transport.
 *
 * Protocol: https://modelcontextprotocol.io/specification
 *
 * Supported operations:
 * - initialize: handshake with server
 * - tools/list: discover available tools
 * - tools/call: execute a tool
 * - resources/list: discover resources
 * - resources/read: read a resource
 * - prompts/list: discover prompts
 * - prompts/get: get a prompt
 *
 * Transports:
 * - stdio: spawn child process, communicate via stdin/stdout (JSON-RPC)
 * - SSE: connect via HTTP Server-Sent Events
 */

import { spawn, type ChildProcess } from 'node:child_process';
import type { McpServerConfig, McpTool, McpResource, McpPrompt, McpCallResult } from './types.js';
import type { Result } from '../types/common.js';

export class McpClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private connected = false;

  constructor(private config: McpServerConfig) {}

  /** Connect to MCP server */
  async connect(): Promise<Result<void>> {
    if (this.config.transport === 'stdio') {
      return this.connectStdio();
    } else {
      return this.connectSse();
    }
  }

  /** Disconnect from server */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.connected = false;
  }

  /** List available tools */
  async listTools(): Promise<Result<McpTool[]>> {
    return this.sendRequest('tools/list', {});
  }

  /** Call a tool */
  async callTool(name: string, arguments_: Record<string, unknown>): Promise<Result<McpCallResult>> {
    return this.sendRequest('tools/call', { name, arguments: arguments_ });
  }

  /** List resources */
  async listResources(): Promise<Result<McpResource[]>> {
    return this.sendRequest('resources/list', {});
  }

  /** Read a resource */
  async readResource(uri: string): Promise<Result<McpCallResult>> {
    return this.sendRequest('resources/read', { uri });
  }

  /** List prompts */
  async listPrompts(): Promise<Result<McpPrompt[]>> {
    return this.sendRequest('prompts/list', {});
  }

  /** Get a prompt */
  async getPrompt(name: string, arguments_?: Record<string, string>): Promise<Result<McpCallResult>> {
    return this.sendRequest('prompts/get', { name, arguments: arguments_ });
  }

  private async connectStdio(): Promise<Result<void>> {
    // 1. Spawn process with config.command + config.args
    // 2. Setup JSON-RPC over stdin/stdout
    // 3. Send initialize request
    // 4. Wait for response
    throw new Error('Not implemented');
  }

  private async connectSse(): Promise<Result<void>> {
    // 1. Connect to SSE endpoint at config.url
    // 2. Send initialize
    // 3. Wait for response
    throw new Error('Not implemented');
  }

  private async sendRequest(method: string, params: unknown): Promise<Result<any>> {
    // JSON-RPC 2.0: { jsonrpc: "2.0", id, method, params }
    throw new Error('Not implemented');
  }
}
```

### 6.2 src/mcp/server-manager.ts
```typescript
/**
 * MCP Server Manager — manage multiple MCP server connections.
 *
 * Config in mekong.yaml:
 *   mcp:
 *     servers:
 *       - name: filesystem
 *         transport: stdio
 *         command: npx
 *         args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
 *       - name: github
 *         transport: stdio
 *         command: npx
 *         args: ["-y", "@modelcontextprotocol/server-github"]
 *         env:
 *           GITHUB_TOKEN: "${GITHUB_TOKEN}"
 *       - name: custom-api
 *         transport: sse
 *         url: "http://localhost:3001/mcp"
 */

import type { McpServerConfig, McpServerState, McpTool } from './types.js';
import type { McpClient } from './client.js';
import type { ToolDefinition } from '../types/tool.js';
import type { Result } from '../types/common.js';

export class McpServerManager {
  private clients = new Map<string, McpClient>();
  private states = new Map<string, McpServerState>();

  /** Connect to all configured servers */
  async connectAll(configs: McpServerConfig[]): Promise<void> {
    // Connect in parallel, log failures but don't block
    throw new Error('Not implemented');
  }

  /** Connect to a specific server */
  async connect(config: McpServerConfig): Promise<Result<McpServerState>> {
    throw new Error('Not implemented');
  }

  /** Disconnect from a server */
  async disconnect(name: string): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Get all available tools across all connected servers */
  getAllTools(): McpTool[] {
    throw new Error('Not implemented');
  }

  /** Convert MCP tools to mekong ToolDefinitions */
  toToolDefinitions(): ToolDefinition[] {
    // Map each McpTool to a ToolDefinition with:
    // - name prefixed: "mcp.{server}.{tool}"
    // - security level: 2 (external service)
    // - execute function that calls McpClient.callTool
    throw new Error('Not implemented');
  }

  /** Get all server states */
  getStates(): McpServerState[] {
    return Array.from(this.states.values());
  }

  /** Health check all servers */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    throw new Error('Not implemented');
  }
}
```

---

## 7. SELF-IMPROVEMENT ENGINE

### 7.1 src/self-improve/execution-feedback.ts
```typescript
/**
 * Execution Feedback Loop — learn from success/failure patterns.
 *
 * After every task:
 * 1. Record execution details (tools used, tokens, time, result)
 * 2. Compare with historical data for similar tasks
 * 3. Identify patterns (what approaches work for what task types)
 * 4. Update internal routing preferences
 *
 * Patterns detected:
 * - "Code review tasks succeed more with reviewer agent than coder agent"
 * - "Deploy SOPs fail 40% of the time at the test step — needs investigation"
 * - "DeepSeek is 5x cheaper and equally accurate for lead qualification"
 */

import type { ExecutionRecord, LearnedPattern } from './types.js';
import type { Result } from '../types/common.js';

export class ExecutionFeedback {
  private recordsPath: string;
  private patternsPath: string;

  constructor(dataDir: string) {
    this.recordsPath = `${dataDir}/executions.jsonl`;
    this.patternsPath = `${dataDir}/patterns.json`;
  }

  /** Record task execution */
  async record(execution: ExecutionRecord): Promise<void> {
    // Append to JSONL
    throw new Error('Not implemented');
  }

  /** Analyze execution history to find patterns */
  async analyzePatterns(minOccurrences: number): Promise<LearnedPattern[]> {
    // 1. Group executions by taskType
    // 2. For each type: find success patterns (what tools/models/approaches work)
    // 3. Find failure patterns (common error types)
    // 4. Find optimization opportunities (cheaper model worked equally well)
    throw new Error('Not implemented');
  }

  /** Get best approach for a task type based on history */
  async getBestApproach(taskType: string): Promise<{
    recommendedAgent: string;
    recommendedModel: string;
    estimatedDuration: number;
    estimatedCost: number;
    confidence: number;
  } | null> {
    // Query historical successes for this task type
    // Return the approach with highest success rate + lowest cost
    throw new Error('Not implemented');
  }
}
```

### 7.2 src/self-improve/skill-evolution.ts
```typescript
/**
 * Skill Evolution — auto-generate new skills from recurring patterns.
 *
 * Detection flow:
 * 1. Monitor execution records for recurring sequences
 *    e.g. "user runs shell:git-diff → llm:review → file:save-report" 3+ times
 * 2. Propose new SOP that automates this sequence
 * 3. User approves → skill saved to ~/.mekong/skills/learned/
 * 4. Next time similar pattern detected → suggest using the learned skill
 *
 * Similar to OpenClaw's self-hackable skills, but with user approval gate (Jidoka).
 */

import type { LearnedSkill, ExecutionRecord } from './types.js';
import type { LlmRouter } from '../llm/router.js';
import type { Result } from '../types/common.js';

export class SkillEvolution {
  private skillsPath: string;

  constructor(dataDir: string, private llm: LlmRouter) {
    this.skillsPath = `${dataDir}/learned-skills.json`;
  }

  /** Detect recurring patterns that could become skills */
  async detectCandidates(executions: ExecutionRecord[], minOccurrences: number): Promise<LearnedSkill[]> {
    // 1. Extract tool-call sequences from each execution
    // 2. Find sequences that appear >= minOccurrences times
    // 3. For each sequence: generate SOP YAML via LLM
    // 4. Return as proposed LearnedSkills
    throw new Error('Not implemented');
  }

  /** Generate SOP definition from a pattern */
  async generateSop(pattern: {
    toolSequence: string[];
    commonInputs: Record<string, unknown>;
    description: string;
  }): Promise<Result<string>> {
    // Call LLM: "Given this tool sequence, generate a mekong SOP YAML"
    throw new Error('Not implemented');
  }

  /** Approve and save a learned skill */
  async approve(skill: LearnedSkill): Promise<Result<void>> {
    // Save to skills directory
    // If SOP type: save YAML to templates
    // Update learned-skills.json
    throw new Error('Not implemented');
  }

  /** Get active learned skills */
  async getActiveSkills(): Promise<LearnedSkill[]> {
    throw new Error('Not implemented');
  }

  /** Suggest relevant learned skill for current task */
  async suggestSkill(taskDescription: string): Promise<LearnedSkill | null> {
    // Compare task with learned skill triggers
    throw new Error('Not implemented');
  }
}
```

### 7.3 src/self-improve/prompt-refiner.ts
```typescript
/**
 * Prompt Refiner — optimize prompts via A/B testing.
 *
 * How it works:
 * 1. For each agent/SOP context, maintain prompt variants
 * 2. Randomly assign variant per execution (or use best-performing)
 * 3. Track success rate, token usage, cost per variant
 * 4. After N samples: statistically determine winner
 * 5. Promote winner, generate new challenger variant
 *
 * Auto-generates challenger variants by:
 * - Shortening (reduce tokens)
 * - Adding examples (improve accuracy)
 * - Restructuring (change reasoning approach)
 * - Model-specific optimization (adapt for DeepSeek vs Claude)
 */

import type { PromptVariant } from './types.js';
import type { LlmRouter } from '../llm/router.js';
import type { Result } from '../types/common.js';

export class PromptRefiner {
  private variantsPath: string;

  constructor(dataDir: string, private llm: LlmRouter) {
    this.variantsPath = `${dataDir}/prompt-variants.json`;
  }

  /** Get the prompt variant to use for a context */
  async getVariant(context: string): Promise<PromptVariant | null> {
    // If A/B test active: return random variant
    // If winner determined: return winner
    // If no variants: return null (use default)
    throw new Error('Not implemented');
  }

  /** Record result for a variant */
  async recordResult(variantId: string, result: {
    success: boolean;
    tokens: number;
    duration: number;
    cost: number;
  }): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Generate a challenger variant */
  async generateChallenger(context: string, currentBest: PromptVariant, strategy: 'shorten' | 'examples' | 'restructure'): Promise<Result<PromptVariant>> {
    // Call LLM to rewrite the prompt based on strategy
    throw new Error('Not implemented');
  }

  /** Evaluate if we have a statistical winner */
  async evaluateTest(context: string): Promise<{
    hasWinner: boolean;
    winnerId?: string;
    confidence?: number;
    sampleSize: number;
  }> {
    // Need minimum 30 samples per variant
    // Use chi-squared test for success rate comparison
    throw new Error('Not implemented');
  }
}
```

### 7.4 src/self-improve/memory-curator.ts
```typescript
/**
 * Memory Curator — auto-clean, organize, and optimize memory.
 *
 * Functions:
 * 1. Session compaction: summarize old sessions, keep recent ones full
 * 2. Knowledge dedup: merge duplicate entities
 * 3. Relevance scoring: identify stale knowledge
 * 4. Context optimization: pre-select most relevant memory for each task
 * 5. Storage management: enforce size limits, rotate old data
 */

import type { Result } from '../types/common.js';

export class MemoryCurator {
  constructor(
    private memoryDir: string,
    private llm: any,               // LlmRouter — avoid circular import
  ) {}

  /** Compact old sessions (keep last N full, summarize the rest) */
  async compactSessions(keepFull: number): Promise<Result<{ compacted: number; spaceSaved: number }>> {
    // 1. List all sessions sorted by date
    // 2. Keep newest `keepFull` sessions intact
    // 3. For older sessions: call LLM to generate summary
    // 4. Replace full session with summary
    throw new Error('Not implemented');
  }

  /** Deduplicate knowledge entities */
  async deduplicateKnowledge(): Promise<Result<{ merged: number }>> {
    // Find entities with similar names/attributes
    // Merge duplicates, keep highest confidence
    throw new Error('Not implemented');
  }

  /** Score knowledge relevance */
  async scoreRelevance(): Promise<Array<{ entityId: string; score: number; lastUsed: string }>> {
    // Score based on: recency, frequency of access, confidence
    throw new Error('Not implemented');
  }

  /** Pre-select relevant memory for a task */
  async selectContext(taskDescription: string, maxTokens: number): Promise<string> {
    // 1. Score all knowledge entities by relevance to task
    // 2. Select top entities that fit within maxTokens
    // 3. Format as context string
    throw new Error('Not implemented');
  }

  /** Get storage stats */
  async getStorageStats(): Promise<{
    totalSize: number;
    sessions: { count: number; size: number };
    knowledge: { entities: number; size: number };
    skills: { count: number; size: number };
    metrics: { points: number; size: number };
  }> {
    throw new Error('Not implemented');
  }

  /** Cleanup: remove data older than retention period */
  async cleanup(retentionDays: number): Promise<Result<{ removed: number; spaceSaved: number }>> {
    throw new Error('Not implemented');
  }
}
```

---

## 8. PLUGIN SYSTEM

### 8.1 src/plugins/loader.ts
```typescript
/**
 * Plugin Loader — discover, validate, and load plugins.
 *
 * Plugin locations:
 * - ~/.mekong/plugins/          — user-installed plugins
 * - ./mekong-plugins/           — project-local plugins
 * - From marketplace packages   — bundled with SOP packages
 *
 * Loading flow:
 * 1. Scan plugin directories for manifest.json files
 * 2. Validate manifest (check permissions, compatibility)
 * 3. Check if permissions were approved by user
 * 4. Load plugin module (dynamic import)
 * 5. Call onLoad() hook
 * 6. Register tools/agents/commands provided by plugin
 *
 * Security: Plugins run in same process but with limited API surface.
 * All filesystem/network access goes through mekong's security system.
 */

import type { PluginManifest, PluginInstance, PluginHooks, PluginApi } from './types.js';
import type { Result } from '../types/common.js';

export class PluginLoader {
  private plugins = new Map<string, PluginInstance>();
  private approvedPermissions = new Map<string, string[]>();  // plugin → approved permissions

  constructor(
    private pluginDirs: string[],
    private api: PluginApi,
  ) {}

  /** Discover and load all plugins */
  async loadAll(): Promise<{ loaded: string[]; failed: Array<{ name: string; error: string }> }> {
    // 1. Scan all plugin directories
    // 2. For each manifest found: validate → check permissions → load
    throw new Error('Not implemented');
  }

  /** Load a specific plugin */
  async load(manifestPath: string): Promise<Result<PluginInstance>> {
    // 1. Read manifest.json
    // 2. Validate compatibility (mekongVersion check)
    // 3. Check required integrations/tools
    // 4. Check/request permissions
    // 5. Dynamic import main entry
    // 6. Call onLoad()
    // 7. Register provided tools/agents
    throw new Error('Not implemented');
  }

  /** Unload a plugin */
  async unload(pluginName: string): Promise<Result<void>> {
    // Call onUnload(), remove registrations
    throw new Error('Not implemented');
  }

  /** Get all loaded plugins */
  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /** Dispatch lifecycle hook to all plugins */
  async dispatchHook<K extends keyof PluginHooks>(hook: K, ...args: any[]): Promise<void> {
    // Call hook on all loaded plugins that implement it
    // Log errors but don't block
    throw new Error('Not implemented');
  }
}
```

### 8.2 src/plugins/api.ts
```typescript
/**
 * Plugin API — the surface area available to plugins.
 *
 * Restricted by permissions:
 * - filesystem:read → can call readMemory, getConfig
 * - filesystem:write → can call writeMemory
 * - network:outbound → can use http tools
 * - shell:execute → can call shell tools
 * - llm:call → can call callLlm
 * - integrations:access → can use integrations
 */

import type { PluginApi, PluginPermission } from './types.js';
import type { ToolDefinition } from '../types/tool.js';
import type { AgentDefinition } from '../types/agent.js';

export function createPluginApi(
  pluginName: string,
  permissions: PluginPermission[],
  deps: {
    toolRegistry: any;
    agentPool: any;
    config: any;
    memory: any;
    eventBus: any;
    llmRouter: any;
    logger: any;
  }
): PluginApi {
  const hasPermission = (p: PluginPermission) => permissions.includes(p);

  return {
    registerTool(tool: ToolDefinition): void {
      deps.toolRegistry.register({ ...tool, name: `plugin.${pluginName}.${tool.name}` });
    },

    registerAgent(agent: AgentDefinition): void {
      deps.agentPool.registerDefinition({ ...agent, name: `plugin.${pluginName}.${agent.name}` });
    },

    getConfig(): Record<string, unknown> {
      if (!hasPermission('filesystem:read')) throw new Error('Permission denied: filesystem:read');
      return deps.config;
    },

    async readMemory(key: string): Promise<unknown> {
      if (!hasPermission('memory:read')) throw new Error('Permission denied: memory:read');
      return deps.memory.get(key);
    },

    async writeMemory(key: string, value: unknown): Promise<void> {
      if (!hasPermission('memory:write')) throw new Error('Permission denied: memory:write');
      return deps.memory.set(key, value);
    },

    emit(event: string, data?: unknown): void {
      deps.eventBus.emit(`plugin.${pluginName}.${event}`, data);
    },

    on(event: string, handler: (data?: unknown) => void): void {
      deps.eventBus.on(event, handler);
    },

    async callLlm(prompt: string, options?: { model?: string; maxTokens?: number }): Promise<string> {
      if (!hasPermission('llm:call')) throw new Error('Permission denied: llm:call');
      const response = await deps.llmRouter.chat({
        messages: [{ role: 'user', content: prompt }],
        ...options,
      });
      return response.content;
    },

    log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
      deps.logger[level](`[plugin:${pluginName}] ${message}`);
    },
  };
}
```

---

## 9. ADVANCED HEARTBEAT (UPGRADE src/core/scheduler.ts)

```typescript
/**
 * UPGRADE from v0.1.0 scheduler.
 * 
 * New capabilities:
 * 1. Cron-based SOP scheduling (from v0.2.0 config)
 * 2. Event-driven triggers (react to system events)
 * 3. Intelligent scheduling (skip if conditions not met)
 * 4. Plugin heartbeat hooks
 * 5. Proactive agent behavior (suggest actions without being asked)
 *
 * IMPORTANT: Keep backward compat with v0.1.0 simple interval-based heartbeat.
 *
 * New trigger types:
 * - cron: standard cron expression
 * - event: fire when event emitted (e.g. "sop:failed")
 * - condition: check periodically, fire when true (e.g. "overdue_invoices > 0")
 * - webhook: fire when external webhook received (future)
 */

import type { MekongConfig } from '../types/config.js';

/** Scheduled task definition */
interface ScheduledTask {
  id: string;
  name: string;
  trigger:
    | { type: 'cron'; expression: string }
    | { type: 'interval'; minutes: number }
    | { type: 'event'; eventName: string; filter?: Record<string, unknown> }
    | { type: 'condition'; check: string; intervalMinutes: number };
  action:
    | { type: 'sop'; sopName: string; inputs?: Record<string, unknown> }
    | { type: 'command'; command: string }
    | { type: 'notify'; message: string; channel?: string }
    | { type: 'function'; handler: () => Promise<void> };
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  failCount: number;
}

// Implementation spec:
// 1. Parse cron expressions using 'cron' package
// 2. Maintain task queue sorted by nextRun
// 3. Main loop: check queue every 30 seconds, run due tasks
// 4. Event triggers: subscribe to event bus
// 5. Condition triggers: evaluate on interval
// 6. Proactive suggestions: daily at configured time, collect
//    pending follow-ups, overdue invoices, SLA risks → notify owner
// 7. Plugin hooks: call dispatchHook('onHeartbeat') each cycle
```

---

## 10. NEW SOP TEMPLATES (5 templates)

### 10.1 templates/kaizen-review.yaml
```yaml
sop:
  name: "Kaizen Performance Review"
  version: "1.0.0"
  category: analytics
  estimated_time: "5min"
  inputs:
    - name: period_days
      type: number
      default: 7
    - name: depth
      type: enum
      options: [quick, standard, deep]
      default: standard
  steps:
    - id: analyze
      name: "Run Kaizen analysis"
      agent: scheduler
      action: llm
      config:
        prompt: |
          Generate Kaizen report for last {period_days} days at {depth} depth.
          Use KaizenReporter.generate()
    - id: bottlenecks
      name: "Identify bottlenecks"
      agent: scheduler
      action: llm
      config:
        prompt: |
          From analysis: {step.analyze.output}
          List top 3 bottlenecks with recommended fixes.
      depends_on: [analyze]
    - id: apply
      name: "Review auto-applicable suggestions"
      action: prompt
      config:
        message: "Apply auto-suggestions above? (y/n/select)"
      depends_on: [bottlenecks]
    - id: save
      name: "Save Kaizen report"
      action: file
      config:
        path: "./reports/kaizen-{date}.md"
        content_from: "step.analyze.output"
      depends_on: [apply]
```

### 10.2 templates/marketplace-publish.yaml
```yaml
sop:
  name: "Publish SOP to Marketplace"
  version: "1.0.0"
  category: development
  estimated_time: "5min"
  inputs:
    - name: sop_dir
      type: path
      required: true
      description: "Directory containing SOP package files"
  steps:
    - id: validate
      name: "Validate package"
      action: shell
      command: "mekong marketplace validate {sop_dir}"
    - id: pack
      name: "Pack into .mkg"
      action: shell
      command: "mekong marketplace pack {sop_dir}"
      depends_on: [validate]
    - id: review
      name: "Review package contents"
      action: prompt
      config:
        message: "Package ready. Review contents above and confirm publish? (y/n)"
      depends_on: [pack]
    - id: publish
      name: "Publish to marketplace"
      action: shell
      command: "mekong marketplace publish {sop_dir}/*.mkg"
      depends_on: [review]
      requires_approval: "true"
```

### 10.3 templates/self-audit.yaml
```yaml
sop:
  name: "System Self-Audit"
  version: "1.0.0"
  category: analytics
  estimated_time: "10min"
  steps:
    - id: health
      name: "System health check"
      agent: scheduler
      action: llm
      config:
        prompt: |
          Run full system health check:
          1. All integrations healthy?
          2. MCP servers connected?
          3. Memory storage within limits?
          4. Metrics collection working?
          5. Scheduled tasks running on time?
    - id: patterns
      name: "Analyze execution patterns"
      agent: scheduler
      action: llm
      config:
        prompt: "Run ExecutionFeedback.analyzePatterns(5) to find recurring patterns"
      depends_on: [health]
    - id: skills
      name: "Check for new skill candidates"
      agent: scheduler
      action: llm
      config:
        prompt: "Run SkillEvolution.detectCandidates() — any new automatable patterns?"
      depends_on: [patterns]
    - id: memory
      name: "Curate memory"
      agent: scheduler
      action: llm
      config:
        prompt: "Run MemoryCurator: compact old sessions, deduplicate knowledge, cleanup stale data"
      depends_on: [skills]
    - id: report
      name: "Generate audit report"
      action: file
      config:
        path: "./reports/self-audit-{date}.md"
        content_from: "step.health.output + step.patterns.output + step.skills.output + step.memory.output"
      depends_on: [memory]
```

### 10.4 templates/competitive-analysis.yaml
```yaml
sop:
  name: "Competitive Analysis"
  version: "1.0.0"
  category: business
  estimated_time: "15min"
  inputs:
    - name: competitors
      type: string
      required: true
      description: "Comma-separated list of competitor names/URLs"
    - name: focus
      type: enum
      options: [pricing, features, positioning, all]
      default: all
  steps:
    - id: research
      name: "Research competitors"
      agent: researcher
      action: llm
      config:
        prompt: |
          Research these competitors: {competitors}
          Focus: {focus}
          For each: pricing, key features, target audience, recent changes.
    - id: compare
      name: "Comparative analysis"
      agent: researcher
      action: llm
      config:
        prompt: |
          Based on research: {step.research.output}
          Create comparison matrix.
          Identify our advantages and gaps.
          Suggest 3 actionable differentiators.
      depends_on: [research]
    - id: save
      name: "Save analysis"
      action: file
      config:
        path: "./reports/competitive-analysis-{date}.md"
        content_from: "step.compare.output"
      depends_on: [compare]
```

### 10.5 templates/plugin-create.yaml
```yaml
sop:
  name: "Create Plugin Scaffold"
  version: "1.0.0"
  category: development
  estimated_time: "5min"
  inputs:
    - name: plugin_name
      type: string
      required: true
    - name: description
      type: string
      required: true
    - name: provides
      type: enum
      options: [tool, agent, sop, integration]
      required: true
  steps:
    - id: scaffold
      name: "Generate plugin structure"
      agent: coder
      action: llm
      config:
        prompt: |
          Create plugin scaffold at ./mekong-plugins/{plugin_name}/:
          - manifest.json with name @me/{plugin_name}, provides: {provides}
          - index.ts with onLoad/onUnload hooks
          - README.md with description: {description}
          - Basic implementation for {provides} type
    - id: validate
      name: "Validate plugin"
      action: shell
      command: "mekong plugin validate ./mekong-plugins/{plugin_name}"
      depends_on: [scaffold]
    - id: test
      name: "Load and test plugin"
      action: shell
      command: "mekong plugin load ./mekong-plugins/{plugin_name}"
      depends_on: [validate]
```

---

## 11. CONFIG UPDATES — thêm vào mekong.yaml

```yaml
# THÊM sections này (giữ nguyên v0.1.0 + v0.2.0 config)

mcp:
  servers:
    # Example configs — user customizes these
    # - name: filesystem
    #   transport: stdio
    #   command: npx
    #   args: ["-y", "@modelcontextprotocol/server-filesystem", "./"]
    # - name: github
    #   transport: stdio
    #   command: npx
    #   args: ["-y", "@modelcontextprotocol/server-github"]
    #   env:
    #     GITHUB_TOKEN: "${GITHUB_TOKEN}"

marketplace:
  registry_repo: "mekong-cli/marketplace"
  cache_dir: ~/.mekong/marketplace/cache
  packages_dir: ~/.mekong/marketplace/packages
  update_check_hours: 24
  github_token_env: GITHUB_TOKEN         # for publishing

plugins:
  dirs:
    - ~/.mekong/plugins
    - ./mekong-plugins
  auto_load: true

kaizen:
  enabled: true
  metrics_dir: ~/.mekong/kaizen
  retention_days: 90
  auto_suggestions: true                  # suggest improvements automatically
  auto_apply_safe: false                  # auto-apply safe suggestions (model_downgrade, cache)
  report_schedule: "0 18 * * 5"           # Friday 6 PM

self_improve:
  enabled: true
  data_dir: ~/.mekong/self-improve
  execution_feedback: true
  skill_evolution: true
  prompt_refinement: true
  min_samples_for_pattern: 5
  ab_test_min_samples: 30
  memory_compact_keep_full: 20            # keep last 20 sessions full

# UPGRADE heartbeat (extend v0.2.0)
heartbeat:
  enabled: true
  interval_minutes: 30
  checklist_file: HEARTBEAT.md
  scheduled_sops:
    # From v0.2.0:
    - name: daily-standup
      cron: "0 8 * * *"
    - name: payment-followup
      cron: "0 10 * * 1"
    - name: weekly-report
      cron: "0 18 * * 0"
    # NEW v0.3.0:
    - name: kaizen-review
      cron: "0 18 * * 5"                 # Friday 6 PM
      inputs: { period_days: 7, depth: standard }
    - name: self-audit
      cron: "0 3 1 * *"                  # 1st of month, 3 AM
  
  # NEW: event triggers
  event_triggers:
    - event: "sop:failed"
      action:
        type: notify
        message: "SOP failed: {{sopName}} — {{error}}"
        channel: slack
    - event: "budget:exceeded"
      action:
        type: notify
        message: "Budget exceeded for task: {{taskId}}"
        channel: slack
    - event: "crm:ticket_sla_risk"
      action:
        type: sop
        sopName: support-triage
        inputs: { ticket_id: "{{ticketId}}" }
  
  # NEW: proactive suggestions
  proactive:
    enabled: true
    daily_briefing_time: "08:00"
    suggest_follow_ups: true
    suggest_overdue_actions: true
    suggest_kaizen_improvements: true
```

---

## 12. NEW CLI COMMANDS

### 12.1 src/cli/commands/kaizen.ts
```typescript
/**
 * `mekong kaizen` — Performance analytics and improvement.
 *
 *   mekong kaizen                      Quick health check
 *   mekong kaizen report [--days=7]    Full Kaizen report
 *   mekong kaizen report --deep        AI-powered deep analysis
 *   mekong kaizen bottlenecks          List current bottlenecks
 *   mekong kaizen suggestions          List improvement suggestions
 *   mekong kaizen apply <id>           Apply a suggestion
 *   mekong kaizen revert <id>          Revert an applied suggestion
 *   mekong kaizen history              History of applied improvements
 */
```

### 12.2 src/cli/commands/marketplace.ts
```typescript
/**
 * `mekong marketplace` — SOP marketplace.
 *
 *   mekong marketplace search <query>      Search SOPs
 *   mekong marketplace browse [--cat=X]    Browse by category
 *   mekong marketplace info <package>      Package details
 *   mekong marketplace install <package>   Install SOP package
 *   mekong marketplace update [package]    Update installed packages
 *   mekong marketplace uninstall <pkg>     Remove package
 *   mekong marketplace list               List installed packages
 *   mekong marketplace pack <dir>          Pack SOP for publishing
 *   mekong marketplace validate <dir>      Validate package
 *   mekong marketplace publish <mkg>       Publish to marketplace
 */
```

### 12.3 src/cli/commands/plugin.ts
```typescript
/**
 * `mekong plugin` — Plugin management.
 *
 *   mekong plugin list                     List loaded plugins
 *   mekong plugin load <path>              Load a plugin
 *   mekong plugin unload <name>            Unload a plugin
 *   mekong plugin validate <path>          Validate plugin manifest
 *   mekong plugin create                   Interactive plugin scaffold
 *   mekong plugin permissions <name>       View plugin permissions
 */
```

---

## 13. MODULE IMPLEMENTATION ORDER — v0.3.0

```
LAYER A: New Types
  ├── src/kaizen/types.ts
  ├── src/marketplace/types.ts
  ├── src/plugins/types.ts
  ├── src/mcp/types.ts
  └── src/self-improve/types.ts

LAYER B: MCP Client (foundational — tools depend on this)
  ├── src/mcp/client.ts
  ├── src/mcp/server-manager.ts
  ├── src/mcp/tool-adapter.ts
  └── src/mcp/discovery.ts

LAYER C: Kaizen Engine (core analytics)
  ├── src/kaizen/collector.ts
  ├── src/kaizen/analyzer.ts
  ├── src/kaizen/recommender.ts
  └── src/kaizen/report.ts

LAYER D: Self-Improvement (depends on kaizen metrics)
  ├── src/self-improve/execution-feedback.ts
  ├── src/self-improve/skill-evolution.ts
  ├── src/self-improve/prompt-refiner.ts
  └── src/self-improve/memory-curator.ts

LAYER E: Marketplace (depends on sops + packaging)
  ├── src/marketplace/validator.ts
  ├── src/marketplace/packager.ts
  ├── src/marketplace/registry.ts
  ├── src/marketplace/publisher.ts
  ├── src/marketplace/installer.ts
  └── src/marketplace/discovery.ts

LAYER F: Plugin System (depends on everything — extends all modules)
  ├── src/plugins/api.ts
  ├── src/plugins/hooks.ts
  ├── src/plugins/sandbox.ts
  └── src/plugins/loader.ts

LAYER G: Scheduler Upgrade + Config
  ├── UPDATE src/core/scheduler.ts
  └── UPDATE src/config/schema.ts

LAYER H: SOP Templates + CLI Commands
  ├── src/sops/templates/*.yaml (5 new)
  ├── src/cli/commands/kaizen.ts
  ├── src/cli/commands/marketplace.ts
  ├── src/cli/commands/plugin.ts
  └── UPDATE src/cli/index.ts

LAYER I: Wiring + Integration
  └── UPDATE src/core/engine.ts (register all v0.3.0 modules)
```

---

## 14. IMPLEMENTATION NOTES CHO OPUS

1. **Verify v0.2.0 trước**: `pnpm build && pnpm test && mekong sop list` (phải 15 templates)
2. **MCP Client là CRITICAL PATH**: nhiều module khác depend vào nó. Code kỹ, test kỹ.
3. **Kaizen collector phải hook vào event bus**: import eventBus từ v0.1.0, subscribe ngay khi init.
4. **simple-statistics**: import cụ thể functions, ĐỪNG import *
5. **Marketplace dùng GitHub Releases API**: không cần server riêng.
6. **Plugin loader dùng dynamic import()**: `const mod = await import(manifestPath)`
7. **Prompt refiner**: chỉ cần track metrics, ĐỪNG auto-activate A/B tests cho v0.3.0 — để manual trigger qua CLI.
8. **Scheduler upgrade**: GIỮA backward compat — old interval-based heartbeat vẫn phải chạy.
9. **Config extend**: dùng ConfigSchema.extend({}) — KHÔNG replace.
10. **SOP templates chỉ copy YAML files** — không cần code.
11. **Test priorities**: MCP client > Kaizen analyzer > Marketplace installer > Plugin loader
12. **KHÔNG code browser tool** — vẫn để TODO, dành cho v0.4.0
