import { describe, it, expect, beforeEach } from "vitest";
import {
  AgentOrchestrator,
  BaseAgent,
  AGENT_REGISTRY,
  type AgentDefinition,
  type AgentInput,
  type AgentResult,
} from "./index";

// Mock Agent for testing
class TestAgent extends BaseAgent {
  async execute(input: AgentInput): Promise<AgentResult> {
    this.log("execute", input, { success: true });
    return {
      success: true,
      output: `Test agent executed: ${input.command}`,
      duration: 100,
    };
  }
}

describe("VIBE Agents", () => {
  let orchestrator: AgentOrchestrator;
  let testAgent: TestAgent;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    const definition: AgentDefinition = {
      id: "test-agent",
      name: "Test Agent",
      description: "Agent for testing",
      phase: "code",
      capabilities: ["testing"],
      successKpis: ["test_coverage"],
    };
    testAgent = new TestAgent("test-agent", definition);
  });

  describe("Agent Registry", () => {
    it("should have all required agent definitions", () => {
      expect(AGENT_REGISTRY).toHaveLength(6);

      const phases = ["plan", "code", "ship"];
      const registryPhases = AGENT_REGISTRY.map((a) => a.phase);

      phases.forEach((phase) => {
        expect(registryPhases).toContain(phase);
      });
    });

    it("should have project manager in plan phase", () => {
      const pm = AGENT_REGISTRY.find((a) => a.id === "project-manager");
      expect(pm).toBeDefined();
      expect(pm?.phase).toBe("plan");
      expect(pm?.capabilities).toContain("spec-generation");
    });

    it("should have fullstack developer in code phase", () => {
      const dev = AGENT_REGISTRY.find((a) => a.id === "fullstack-developer");
      expect(dev).toBeDefined();
      expect(dev?.phase).toBe("code");
      expect(dev?.capabilities).toContain("multi-file-edit");
    });

    it("should have devops engineer in ship phase", () => {
      const devops = AGENT_REGISTRY.find((a) => a.id === "devops-engineer");
      expect(devops).toBeDefined();
      expect(devops?.phase).toBe("ship");
      expect(devops?.capabilities).toContain("deployment");
    });
  });

  describe("Agent Orchestrator", () => {
    it("should register and retrieve agents", () => {
      orchestrator.register(testAgent);

      const retrieved = orchestrator.getAgent("test-agent");
      expect(retrieved).toBe(testAgent);
    });

    it("should filter agents by phase", () => {
      orchestrator.register(testAgent);

      const codeAgents = orchestrator.getAgentsByPhase("code");
      expect(codeAgents).toHaveLength(1);
      expect(codeAgents[0]).toBe(testAgent);
    });

    it("should execute workflow successfully", async () => {
      orchestrator.register(testAgent);

      const input: AgentInput = {
        command: "test command",
        context: { test: true },
      };

      const results = await orchestrator.executeWorkflow("code", input);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it("should stop workflow on failure", async () => {
      class FailingAgent extends BaseAgent {
        async execute(input: AgentInput): Promise<AgentResult> {
          return {
            success: false,
            output: "Test failed",
            duration: 50,
          };
        }
      }

      const failingAgent = new FailingAgent("failing-agent", {
        id: "failing-agent",
        name: "Failing Agent",
        description: "Agent that always fails",
        phase: "code",
        capabilities: ["failing"],
        successKpis: [],
      });

      orchestrator.register(testAgent);
      orchestrator.register(failingAgent);

      const input: AgentInput = {
        command: "test command",
        context: {},
      };

      const results = await orchestrator.executeWorkflow("code", input);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it("should return registry", () => {
      const registry = orchestrator.getRegistry();
      expect(registry).toBe(AGENT_REGISTRY);
    });
  });

  describe("Base Agent", () => {
    it("should log actions", () => {
      testAgent.log("test-action", { input: "test" }, { output: "result" });

      const logs = testAgent.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("test-action");
      expect(logs[0].inputs).toEqual({ input: "test" });
      expect(logs[0].outputs).toEqual({ output: "result" });
    });

    it("should handle non-object inputs/outputs in logs", () => {
      testAgent.log("test", "string-input", 123);

      const logs = testAgent.getLogs();
      expect(logs[0].inputs).toEqual({ value: "string-input" });
      expect(logs[0].outputs).toEqual({ value: 123 });
    });
  });
});
