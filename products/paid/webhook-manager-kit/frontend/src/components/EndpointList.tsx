import React, { useState } from 'react';
import { Plus, Trash2, Activity, Copy, Check } from 'lucide-react';
import { WebhookEndpoint } from '../types';

interface Props {
  endpoints: WebhookEndpoint[];
  onSelect: (endpoint: WebhookEndpoint) => void;
  onDelete: (id: number) => void;
  selectedId: number | null;
  onAdd: () => void;
}

export const EndpointList: React.FC<Props> = ({ endpoints, onSelect, onDelete, selectedId, onAdd }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copySecret = (e: React.MouseEvent, id: number, secret: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-medium text-gray-900">Endpoints</h2>
        <button
          onClick={onAdd}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </button>
      </div>
      <ul className="divide-y divide-gray-200">
        {endpoints.map((endpoint) => (
          <li
            key={endpoint.id}
            onClick={() => onSelect(endpoint)}
            className={`cursor-pointer hover:bg-gray-50 ${
              selectedId === endpoint.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
            }`}
          >
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">{endpoint.description || 'No Description'}</p>
                <div className="ml-2 flex-shrink-0 flex">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    endpoint.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {endpoint.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500 break-all">
                    {endpoint.url}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500 flex items-center">
                    <span className="mr-2">Events: {endpoint.event_types.join(', ')}</span>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => copySecret(e, endpoint.id, endpoint.secret)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy Signing Secret"
                    >
                        {copiedId === endpoint.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(endpoint.id); }}
                        className="text-red-400 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              </div>
            </div>
          </li>
        ))}
        {endpoints.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500 text-sm">
                No endpoints configured.
            </li>
        )}
      </ul>
    </div>
  );
};
