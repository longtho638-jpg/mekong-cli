'use client';

import { useState, useEffect } from 'react';

type AgentStatus = {
  id: string;
  name: string;
  enabled: boolean;
};

type ExecutionResult = {
    agentId: string;
    success: boolean;
    data: any;
    executionTimeMs: number;
    timestamp: string;
};

type SwarmResponse = {
    success: boolean;
    results: ExecutionResult[];
};

export function AgentSwarm() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/agents/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.agents)) {
            setAgents(data.agents);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agent status', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRunSwarm = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('http://localhost:8000/api/agents/run', { method: 'POST' });
      if (res.ok) {
        const data: SwarmResponse = await res.json();
        if (data.success) {
            setResults(data.results);
            setLastRun(new Date().toLocaleTimeString());
        }
      }
    } catch (error) {
      console.error('Failed to run agent swarm', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-8 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🦞</span> AI Agent Swarm
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                Autonomous multi-agent system (AGI Level 5)
            </p>
        </div>
        <button
          onClick={handleRunSwarm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deploying Agents...
            </span>
          ) : (
            'Run Agent Swarm'
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Status Grid */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Fleet Status {agents.length > 0 && `(${agents.length} Agents)`}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.length > 0 ? (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex justify-between items-center"
                >
                  <span className="font-medium text-gray-700">{agent.name}</span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      agent.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {agent.enabled ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                Connecting to Agent Registry...
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="border-t pt-6">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-gray-900">Mission Report</h4>
                <span className="text-xs text-gray-500">Last run: {lastRun}</span>
             </div>

             <div className="grid gap-4">
                 {results.map((res, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-800">{res.agentId}</span>
                            <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">{res.executionTimeMs}ms</span>
                        </div>
                        <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-x-auto">
                            {JSON.stringify(res.data, null, 2)}
                        </pre>
                    </div>
                 ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
