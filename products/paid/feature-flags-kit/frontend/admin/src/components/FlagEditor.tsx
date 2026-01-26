import React, { useState } from 'react';
import type { FeatureFlag, FeatureFlagCreate, TargetingRule } from '../types';
import { RuleBuilder } from './RuleBuilder';
import { Save, X } from 'lucide-react';

interface FlagEditorProps {
  initialData?: FeatureFlag;
  onSave: (data: FeatureFlagCreate) => Promise<void>;
  onCancel: () => void;
}

export const FlagEditor: React.FC<FlagEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [key, setKey] = useState(initialData?.key || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [rules, setRules] = useState<TargetingRule[]>(initialData?.targeting_rules || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        key,
        description,
        is_active: isActive,
        targeting_rules: rules,
      });
    } catch (err) {
      setError('Failed to save flag');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {initialData ? 'Edit Feature Flag' : 'Create New Feature Flag'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="key" className="block text-sm font-medium text-gray-700">
            Flag Key
          </label>
          <input
            type="text"
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={!!initialData} // Key cannot be changed after creation usually
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border disabled:bg-gray-100"
            required
            placeholder="e.g., new-checkout-flow"
          />
          <p className="mt-1 text-xs text-gray-500">Unique identifier for this feature flag.</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            placeholder="What does this flag control?"
          />
        </div>

        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900">
            Global On/Off Switch
          </label>
        </div>
        <p className="text-sm text-gray-500 ml-6 -mt-3">
          If disabled, the flag returns false for everyone, ignoring rules.
        </p>
      </div>

      <div className="border-t pt-6">
        <RuleBuilder rules={rules} onChange={setRules} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <Save size={16} className="mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Flag'}
        </button>
      </div>
    </form>
  );
};
