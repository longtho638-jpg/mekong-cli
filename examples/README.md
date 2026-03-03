# Mekong CLI Examples

Collection of code examples demonstrating Mekong CLI's features and capabilities.

---

## Agents

Examples of using and creating agents.

| Example | Description | Run |
|---------|-------------|-----|
| [GitAgent](./agents/git_agent_example.py) | Version control operations | `python3 examples/agents/git_agent_example.py` |
| [ShellAgent](./agents/shell_agent_example.py) | Shell command execution | `python3 examples/agents/shell_agent_example.py` |
| [FileAgent](./agents/file_agent_example.py) | File read/write/search | `python3 examples/agents/file_agent_example.py` |
| [Custom WeatherAgent](./agents/custom_weather_agent.py) | Build your own agent | `python3 examples/agents/custom_weather_agent.py` |

---

## Workflows

Examples of PEV pattern, DAG execution, and NLU.

| Example | Description | Run |
|---------|-------------|-----|
| [PEV Pattern](./workflows/pev_pattern_example.py) | Plan-Execute-Verify demo | `python3 examples/workflows/pev_pattern_example.py` |
| [DAG Parallel Execution](./workflows/dag_parallel_execution.py) | Parallel task execution | `python3 examples/workflows/dag_parallel_execution.py` |
| [Intent Classification](./workflows/intent_classification.py) | NLU intent routing | `python3 examples/workflows/intent_classification.py` |

---

## RaaS (Revenue-as-a-Service)

Examples of billing, multi-tenant, and webhook integration.

| Example | Description | Run |
|---------|-------------|-----|
| [Submit Mission](./raas/submit_mission.py) | Submit mission to AgencyOS | `python3 examples/raas/submit_mission.py` |
| [Polar Webhook](./raas/polar_webhook_handler.py) | Handle payment webhooks | `python3 examples/raas/polar_webhook_handler.py` |
| [Credit Billing](./raas/credit_billing.py) | Credit tracking system | `python3 examples/raas/credit_billing.py` |
| [Multi-Tenant Setup](./raas/multi_tenant_setup.py) | Tenant isolation | `python3 examples/raas/multi_tenant_setup.py` |

---

## Quick Start

### Prerequisites

```bash
# Install Mekong CLI
pip install -e .

# Set up environment
export LLM_API_KEY=your_key_here
export POLAR_WEBHOOK_SECRET=your_secret_here
```

### Run an Example

```bash
# Try GitAgent
cd /path/to/mekong-cli
python3 examples/agents/git_agent_example.py

# Try Credit Billing
python3 examples/raas/credit_billing.py
```

---

## Creating Your Own Examples

1. **Fork the repository**
   ```bash
   git clone https://github.com/mekong-cli/mekong-cli.git
   ```

2. **Create your example**
   ```bash
   mkdir -p examples/agents
   touch examples/agents/my_custom_agent.py
   ```

3. **Follow the pattern**
   - Import from `mekong.core` or `mekong.agents`
   - Include docstrings
   - Add `if __name__ == "__main__":` block

4. **Submit a PR**
   - Add your example to this README
   - Include description and run command

---

## Need Help?

- **Documentation:** [docs/](../docs/)
- **Revenue Sharing:** [docs/revenue-sharing.md](../docs/revenue-sharing.md)
- **GitHub Issues:** https://github.com/mekong-cli/mekong-cli/issues

---

**Earn Revenue:** When you contribute examples that get used, you earn [revenue share](../docs/revenue-sharing.md)!
