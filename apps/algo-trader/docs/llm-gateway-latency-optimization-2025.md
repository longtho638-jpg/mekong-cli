# LLM Gateway Latency & Resilience Optimization for Trading Systems (2025)

**Date:** March 3, 2026
**Project:** Algo-Trader RAAS/AGI Infrastructure
**Author:** Gemini Assistant

## 1. Executive Summary

This report provides practical recommendations for optimizing the project's existing `LiteLLM` gateway for use in a latency-sensitive algorithmic trading environment. The analysis confirms that the project's current hybrid, multi-tiered architecture (Local, GPU, Cloud) is a best practice.

The key recommendations are to enhance the `LiteLLM` configuration to:
1.  **Define Strict, Tiered Uptime SLOs:** Establish clear uptime targets (e.g., 99.99% for live execution) and use error budgets to manage reliability.
2.  **Implement Intelligent Timeouts:** Use aggressive, per-model timeouts (especially `stream_timeout`) to quickly discard hanging requests.
3.  **Leverage Built-in Circuit Breakers:** Utilize LiteLLM's `retries` and `cooldown` settings to automatically isolate failing model deployments.
4.  **Adopt Advanced Failover Routing:** Move from simple fallbacks to **latency-based routing** as the primary strategy for trading-critical requests.
5.  **Maintain a Hybrid Cost/Latency Model:** Use latency-based routing for trading and `cost-based` routing for non-critical tasks like report generation.

Implementing these patterns will maximize resilience, minimize latency, and provide a robust framework for the trading AGI.

---

## 2. Uptime Requirements & SLOs for a Trading Gateway

For a trading system, uptime is not negotiable. We must move from an implicit assumption of availability to an explicit, measurable objective.

*   **Service Level Indicator (SLI):** The raw metric. For our purposes, the primary SLI is **availability**, measured as the percentage of valid requests that return a successful response.
*   **Service Level Objective (SLO):** Our internal goal for that metric.
*   **Service Level Agreement (SLA):** A formal contract with consequences, typically with external clients. Our internal SLOs should always be stricter than any external SLAs.

### Proposed Tiered SLOs

Not all LLM tasks are equally critical. We recommend a tiered approach:

| Service Tier | Example Tasks | Proposed SLO (Monthly) | Allowed Downtime (Monthly) |
| :--- | :--- | :--- | :--- |
| **Tier 1: Critical** | Live trade execution, Real-time signal analysis | **99.99%** ("Four Nines") | ~4.3 minutes |
| **Tier 2: Important**| Strategy backtesting, Market data analysis | **99.9%** ("Three Nines") | ~43.8 minutes |
| **Tier 3: Non-Critical**| Generating daily reports, Code quality checks | **99.5%** | ~3.6 hours |

### Error Budgets

An SLO of 99.99% means we accept 0.01% of requests failing over a month. This is our **error budget**.

*   If the error budget is consumed, all development focus must shift to reliability and fixing the root cause.
*   If we are well within the budget, we have the confidence to roll out new features.

---

## 3. Core Resiliency Patterns (LiteLLM Configuration)

The following patterns can be implemented directly in your `config.yaml` file for LiteLLM.

### Pattern 1: Intelligent Timeouts

In trading, it's better to fail fast than to wait indefinitely. LiteLLM offers granular timeout controls.

*   `timeout`: Overall time for the request to complete.
*   `stream_timeout`: Max time to wait for the *first token* in a streaming response. This is critical for detecting unresponsive or "hanging" model providers.

**Recommendation:** Set aggressive, per-model timeouts. A local model should respond in under a second, while a cloud API might be given 5-10 seconds.

#### `config.yaml` Example:

```yaml
model_list:
  - model_name: "local-fast"
    litellm_params:
      model: "ollama/phi4:14b-q4_K_M"
      api_base: "http://localhost:11434"
      # Aggressive timeouts for local model
      timeout: 5 # 5-second overall timeout
      stream_timeout: 2 # 2-second timeout for first token

  - model_name: "gpu-coder"
    litellm_params:
      model: "openai/Qwen2.5-Coder-32B-Instruct"
      api_base: "http://localhost:8081/v1"
      timeout: 20
      stream_timeout: 7

  - model_name: "claude-fallback"
    litellm_params:
      model: "anthropic/claude-3-haiku-20240307" # Use a faster cloud model for fallbacks
      api_key: "os.environ/ANTHROPIC_API_KEY"
      timeout: 15
      stream_timeout: 5

router_settings:
  # Global timeout for any model not explicitly configured
  request_timeout: 25
```

### Pattern 2: Circuit Breakers & Retries

A circuit breaker prevents an application from repeatedly trying to call a service that is known to be failing. LiteLLM has this functionality built-in via `retries` and `cooldowns`.

*   `retries`: Number of times to retry a failed request.
*   `cooldown`: When a deployment fails consistently, LiteLLM puts it in a "cooldown" period (default: 1 minute), effectively opening the circuit and preventing further requests to the failing node.

**Recommendation:** Configure a moderate number of retries (1-2) and use the default cooldown. This allows for transient network blips to be handled while properly isolating a truly failing endpoint.

#### `config.yaml` Example:

```yaml
router_settings:
  # Automatically retry failed requests up to 2 times
  num_retries: 2
  # Use the default 1-minute cooldown for failing deployments
  # (This setting is adjusted via `set_deployment` in code if needed, but defaults are sensible)
```

### Pattern 3: Advanced Failover Routing

Your current architecture uses fallbacks, which is good. We can make it exceptional by using a more intelligent routing strategy. For trading, the best strategy is **latency-based routing**.

**Recommendation:**
1.  Set the primary `routing_strategy` to `"latency-based"`. LiteLLM will automatically track the response times of your deployments and prioritize the fastest one.
2.  Define a `fallbacks` chain in case the lowest-latency model fails.

#### `config.yaml` Example:

```yaml
# model_list as defined in Pattern 1...

router_settings:
  # For live trading, always pick the fastest available model
  routing_strategy: "latency-based"
  
  # If the lowest-latency model fails, try the others in this specific order.
  # This defines our resilience pattern.
  fallbacks:
    - ["gpu-coder", "claude-fallback", "local-fast"] 
```
*Note on the fallback order: We place `gpu-coder` first as it's powerful, then the reliable `claude-fallback`, and finally the `local-fast` model as a last resort.*

---

## 4. Latency & Cost Optimization

Your internal analysis on cost is thorough. The hybrid model is the correct approach. The key is to apply the right routing strategy for the right task.

*   **Local Models (e.g., Ollama):** Have the lowest Time-To-First-Token (TTFT) due to zero network latency. They are ideal for interactive, latency-sensitive tasks.
*   **Cloud Models (e.g., Claude/OpenAI):** May have higher raw throughput for very long responses but are subject to network latency. They are best for complex reasoning where generation quality is more important than initial response time.

**Recommendation:** Create model groups (aliases) in LiteLLM to route tasks appropriately.

*   `trading-execution-group`: Uses `latency-based` routing.
*   `reporting-analysis-group`: Uses `cost-based` routing.

#### `config.yaml` Example:

```yaml
# model_list as defined in Pattern 1...

model_group_alias:
  # A group specifically for latency-sensitive trading tasks
  "trading-execution-group": ["local-fast", "gpu-coder", "claude-fallback"]
  
  # A group for background tasks where cost is the primary concern
  "reporting-analysis-group": ["local-fast", "claude-fallback", "gpu-coder"]


router_settings:
  # Default routing for any request not specifying a group
  routing_strategy: "latency-based"

  # Define specific strategies for our groups
  model_group_routing_strategy:
    "trading-execution-group": "latency-based"
    "reporting-analysis-group": "cost-based" # Cheaper models are prioritized

  # Define fallbacks for each group
  fallbacks:
    - "trading-execution-group": ["gpu-coder", "claude-fallback"] 
    - "reporting-analysis-group": ["claude-fallback", "gpu-coder"]

  num_retries: 2
```

In your application code, you would then make a call to `model="trading-execution-group"` or `model="reporting-analysis-group"` to target the correct routing logic.

---

## 5. Summary of Practical Recommendations

1.  **Formalize SLOs:** Adopt and track the tiered SLOs outlined in Section 2.
2.  **Implement Aggressive Timeouts:** Add `timeout` and `stream_timeout` to each model in your `config.yaml` to fail fast.
3.  **Configure Retries:** Set `num_retries: 2` in your `router_settings`.
4.  **Switch to Latency-Based Routing:** Change `routing_strategy` to `"latency-based"` for your primary trading logic.
5.  **Define a Fallback Chain:** Specify a robust `fallbacks` order.
6.  **Use Model Groups:** Create aliases like `trading-execution-group` and `reporting-analysis-group` to separate latency-critical and cost-sensitive workloads.
7.  **Monitor Everything:** Integrate LiteLLM's Prometheus endpoint with your existing Grafana stack to monitor latency, cost, and error rates per model.
