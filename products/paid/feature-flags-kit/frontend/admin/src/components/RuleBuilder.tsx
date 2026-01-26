import React from 'react';
import type { TargetingRule } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface RuleBuilderProps {
  rules: TargetingRule[];
  onChange: (rules: TargetingRule[]) => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ rules, onChange }) => {
  const addRule = () => {
    onChange([
      ...rules,
      { type: 'user_id', operator: 'in', values: [], enabled: true },
    ]);
  };

  const removeRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    onChange(newRules);
  };

  const updateRule = (index: number, field: keyof TargetingRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };

    // Reset fields based on type change
    if (field === 'type') {
      if (value === 'percentage') {
        newRules[index].values = undefined;
        newRules[index].operator = undefined;
        newRules[index].value = 50;
      } else {
        newRules[index].value = undefined;
        newRules[index].operator = 'in';
        newRules[index].values = [];
      }
    }

    onChange(newRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Targeting Rules</h3>
        <button
          type="button"
          onClick={addRule}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
        >
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      {rules.length === 0 && (
        <p className="text-sm text-gray-500 italic">No targeting rules. Flag applies to everyone if active.</p>
      )}

      {rules.map((rule, index) => (
        <div key={index} className="flex flex-col gap-3 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex items-center gap-2">
            <select
              value={rule.type}
              onChange={(e) => updateRule(index, 'type', e.target.value)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1.5 border"
            >
              <option value="user_id">User ID</option>
              <option value="email">Email</option>
              <option value="percentage">Percentage Rollout</option>
            </select>

            {rule.type !== 'percentage' && (
              <select
                value={rule.operator}
                onChange={(e) => updateRule(index, 'operator', e.target.value)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1.5 border"
              >
                <option value="in">is in</option>
                <option value="not_in">is not in</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => removeRule(index)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {rule.type === 'percentage' ? (
             <div className="flex items-center gap-2">
               <input
                 type="range"
                 min="0"
                 max="100"
                 value={rule.value || 0}
                 onChange={(e) => updateRule(index, 'value', parseInt(e.target.value))}
                 className="w-full"
               />
               <span className="text-sm font-medium w-12 text-right">{rule.value}%</span>
             </div>
          ) : (
            <input
              type="text"
              placeholder="Values (comma separated)"
              value={rule.values?.join(', ') || ''}
              onChange={(e) => updateRule(index, 'values', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          )}

          <label className="flex items-center gap-2 text-sm text-gray-600">
             <input
               type="checkbox"
               checked={rule.enabled}
               onChange={(e) => updateRule(index, 'enabled', e.target.checked)}
               className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
             />
             Rule Enabled
          </label>
        </div>
      ))}
    </div>
  );
};
