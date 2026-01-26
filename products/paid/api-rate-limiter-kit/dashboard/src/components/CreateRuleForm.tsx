import React, { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { createRule, RuleCreate } from '../lib/api';

interface CreateRuleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateRuleForm({ onSuccess, onCancel }: CreateRuleFormProps) {
  const [formData, setFormData] = useState<RuleCreate>({
    path: '',
    method: 'GET',
    limit: 100,
    window: 60,
    strategy: 'fixed',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ensure path starts with /
      const ruleToSubmit = {
        ...formData,
        path: formData.path.startsWith('/') ? formData.path : `/${formData.path}`
      };

      await createRule(ruleToSubmit);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add New Rate Limit Rule</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
          <select
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
            <option value="*">ALL (*)</option>
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">API Path</label>
          <input
            type="text"
            placeholder="/api/v1/resource"
            value={formData.path}
            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Request Limit</label>
          <input
            type="number"
            min="1"
            value={formData.limit}
            onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) })}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Window (Seconds)</label>
          <input
            type="number"
            min="1"
            value={formData.window}
            onChange={(e) => setFormData({ ...formData, window: parseInt(e.target.value) })}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="fixed"
                checked={formData.strategy === 'fixed'}
                onChange={() => setFormData({ ...formData, strategy: 'fixed' })}
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">Fixed Window (Standard)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="sliding"
                checked={formData.strategy === 'sliding'}
                onChange={() => setFormData({ ...formData, strategy: 'sliding' })}
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">Sliding Window (Smoother)</span>
            </label>
          </div>
        </div>

        <div className="col-span-2 flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Saving...' : <><Save className="h-4 w-4" /> Save Rule</>}
          </button>
        </div>
      </form>
    </div>
  );
}
