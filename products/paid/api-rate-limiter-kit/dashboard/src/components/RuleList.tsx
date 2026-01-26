import React, { useEffect, useState } from 'react';
import { Trash2, Plus, RefreshCw, Zap, Clock } from 'lucide-react';
import { getRules, deleteRule, RateLimitRule } from '../lib/api';
import { CreateRuleForm } from './CreateRuleForm';

export function RuleList() {
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await getRules();
      setRules(data);
    } catch (err) {
      console.error("Failed to fetch rules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [refreshKey]);

  const handleDelete = async (method: string, path: string) => {
    if (!confirm(`Are you sure you want to delete the rule for ${method} ${path}?`)) return;

    try {
      await deleteRule(method, path);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error("Failed to delete rule", err);
      alert("Failed to delete rule");
    }
  };

  const handleCreated = () => {
    setShowCreate(false);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Rate Limit Rules</h2>
        <div className="flex gap-2">
            <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
            >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <Plus className="h-5 w-5" />
                Add Rule
            </button>
        </div>
      </div>

      {showCreate && (
        <CreateRuleForm onSuccess={handleCreated} onCancel={() => setShowCreate(false)} />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {rules.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500">
            No rules configured. Add one to start limiting traffic.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Path</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Limit</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Window</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Strategy</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((rule, idx) => (
                  <tr key={`${rule.method}-${rule.path}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                        ${rule.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                          rule.method === 'POST' ? 'bg-green-100 text-green-700' :
                          rule.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                          rule.method === '*' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {rule.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{rule.path}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold">{rule.limit}</span>
                            <span className="text-gray-400 text-xs">reqs</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span>{rule.window}s</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="capitalize text-sm text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full bg-gray-50">
                            {rule.strategy}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(rule.method, rule.path)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                        title="Delete Rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
