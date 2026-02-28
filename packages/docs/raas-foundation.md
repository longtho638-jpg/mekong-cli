# RaaS Foundation: Revenue-as-a-Service Infrastructure

## 1. Vision
The **Revenue-as-a-Service (RaaS)** model moves away from selling "hours" or "man-power" and toward selling **outcomes**. Mekong CLI is the infrastructure that makes this transition possible by automating the entire delivery lifecycle.

In a RaaS agency, success is measured by **Mission Completion** within the **Binh Phap Quality Gates**.

## 2. Antigravity Proxy: The Intelligence Hub
The Antigravity Proxy is a mission-critical component located at `port 11436`. It acts as a unified abstraction layer for Large Language Models.

### Key Capabilities:
- **Provider Agility**: Swap between Anthropic, Google AI, OpenRouter, and local Ollama without changing a single line of application code.
- **Resilience**: Implemented via the **Proxy Autonomy Protocol**. When one account hits a `RESOURCE_EXHAUSTED` (429) error, the proxy triggers a surgical reset and fails over to the next available account or model.
- **Intelligence Margin Optimization**: Routes small logic checks and terminal commands to high-speed, low-cost models (e.g., Gemini 1.5 Flash, Claude 3.5 Haiku) while reserving complex architectural reasoning for premium models (Opus 4.5/4.6, Gemini 1.5 Pro).

## 3. Tiered Service Model
Mekong CLI supports a tiered intelligence model that allows agencies to scale from local experimentation to enterprise-grade swarms.

### Community Tier (Free)
- **Deployment**: Local edge nodes (Developer laptop, Mac Mini).
- **Intelligence**: Uses local **Ollama** models or user-provided API keys.
- **Recipes**: Access to public Binh Phap recipes.
- **Best For**: Individual developers, small automation tasks, and open-source contributions.

### Agency Tier (Paid)
- **Deployment**: Managed edge nodes with 24/7 uptime.
- **Intelligence**: Integrated access to the global **Antigravity Proxy** network.
- **Advanced Features**:
  - **Multi-Agent Teams**: Parallel execution of missions using specialized sub-agents (Security, Tech Debt, Perf).
  - **Proactive Maintenance**: Priority Auto-CTO campaigns that keep the codebase at 100% Binh Phap compliance.
  - **Priority Support**: Direct access to the Binh Phap Venture Studio engineering team.
- **Benefits**:
  - High-throughput access to specialized models (Opus 4.5/4.6, Gemini 1.5 Pro).
  - Automatic load balancing and failover across multiple provider accounts.
  - Guaranteed execution of "Auto-CTO" campaigns.
- **Revenue Model**: Agencies charge clients based on "Mission Success Credits" rather than hourly rates.

### Enterprise Tier (Custom)
- **Deployment**: Private dedicated GPU clusters and distributed global swarms.
- **Intelligence**: Fine-tuned models on private agency knowledge bases and proprietary data.
- **Advanced Capabilities**:
  - **Private Knowledge Vaulting**: No data leaves the corporate boundary; local model execution on private hardware.
  - **Custom Quality Gate Enforcement**: Integration with specific industry compliance (HIPAA, SOC2, etc.).
  - **White-label RaaS Dashboards**: Custom portals for end-clients to monitor mission progress and ROI.
  - **Strategic AGI Evolution**: Custom autonomous loops designed for specific business domains (Trading, F&B, Logistics).
- **Benefits**:
  - Maximum security and data sovereignty.
  - Bespoke automation strategies.
  - Quarterly DR drills and dedicated support engineers.

## 4. Tôm Hùm: The Autonomous Operator
Tôm Hùm (OpenClaw) is the daemon that ensures the agency never sleeps. It transforms a static repository into a living service.

### Self-CTO Logic:
When no human missions are pending, Tôm Hùm initiates "Quality Campaigns":
1. **Scout**: Finds `console.log`, `TODO` comments, or untyped variables.
2. **Fix**: Deploys a CC CLI session to automatically implement fixes.
3. **Verify**: Runs the full test suite to ensure no regressions.
4. **Commit**: Saves changes with a professional, Binh Phap compliant commit message.

## 5. Scaling the Agency
- **Edge Node**: A single MacBook running Mekong CLI.
- **Swarm**: Multiple nodes connected via a central task queue (Managed by Tôm Hùm).
- **Green Production**: Every change is verified by CI/CD and production smoke tests before being marked "Done" (Điều 49).

---
© 2026 Binh Phap Venture Studio.
*"The supreme art of war is to subdue the enemy without fighting."*
