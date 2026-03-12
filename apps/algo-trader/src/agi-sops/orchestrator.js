/**
 * AGI SOPs Orchestrator
 * Parses and executes SOP workflows using Cloudflare Workers AI
 */

import { parseSOP } from './sop-parser.js';
import { executeAction } from './actions/registry.js';

export class Orchestrator {
  constructor(options = {}) {
    this.model = options.model || '@cf/meta/llama-3-8b-instruct';
    this.accountId = options.accountId || process.env.CF_ACCOUNT_ID;
    this.apiToken = options.apiToken || process.env.CF_API_TOKEN;
    // For Workers runtime: use env.AI binding
    this.ai = options.ai || null;
    this.sops = new Map();
    this.executionHistory = [];
  }

  /**
   * Load SOP from YAML/JSON definition
   */
  async loadSOP(name, definition) {
    const parsed = await parseSOP(definition);
    this.sops.set(name, parsed);
    console.log(`[Orchestrator] Loaded SOP: ${name}`);
    return parsed;
  }

  /**
   * Execute SOP with given context
   */
  async execute(name, context = {}) {
    const sop = this.sops.get(name);
    if (!sop) {
      throw new Error(`SOP not found: ${name}`);
    }

    console.log(`[Orchestrator] Executing SOP: ${name}`);

    const result = {
      sopName: name,
      startTime: Date.now(),
      steps: [],
      status: 'running'
    };

    try {
      for (const step of sop.steps) {
        const stepResult = await this.executeStep(step, context);
        result.steps.push(stepResult);

        if (stepResult.status === 'failed' && step.onError === 'abort') {
          result.status = 'aborted';
          break;
        }
      }

      result.status = 'completed';
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
    }

    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;
    this.executionHistory.push(result);

    return result;
  }

  /**
   * Execute single SOP step with LLM guidance using CF Workers AI
   */
  async executeStep(step, context) {
    console.log(`[Step] ${step.name || step.action}`);

    try {
      // Use LLM to parse/validate parameters if needed
      if (step.prompt) {
        const llmOutput = await this.runInference(step.prompt, context);

        step.params = {
          ...step.params,
          llmOutput
        };
      }

      // Execute action
      const actionResult = await executeAction(step.action, step.params);

      return {
        name: step.name || step.action,
        status: 'success',
        result: actionResult
      };
    } catch (error) {
      return {
        name: step.name || step.action,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Run LLM inference via Cloudflare Workers AI
   */
  async runInference(prompt, context = {}) {
    const messages = [{
      role: 'user',
      content: prompt,
      context: JSON.stringify(context)
    }];

    // Workers runtime with AI binding
    if (this.ai) {
      const response = await this.ai.run(this.model, { messages });
      return response.response || response.result;
    }

    // Node.js runtime with REST API
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`CF AI API error: ${error}`);
    }

    const result = await response.json();
    return result.result?.response || result.response;
  }

  /**
   * Get execution history
   */
  getHistory() {
    return this.executionHistory;
  }
}

export default Orchestrator;
