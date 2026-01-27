'use client';

import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'user' | 'transaction' | 'audit';
  title: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface Props {
  results: {
    users?: SearchResult[];
    transactions?: SearchResult[];
    audit?: SearchResult[];
  };
  total: number;
  queryTime: number;
}

export function SearchResults({ results, total, queryTime }: Props) {
  const allResults = [
    ...(results.users || []).map(r => ({ ...r, type: 'user' as const })),
    ...(results.transactions || []).map(r => ({ ...r, type: 'transaction' as const })),
    ...(results.audit || []).map(r => ({ ...r, type: 'audit' as const })),
  ];

  if (allResults.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed">
        <p>No results found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-500 flex justify-between items-center">
        <span>Found {total} results</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">⚡ {queryTime}ms</span>
      </div>

      <div className="space-y-3">
        {allResults.map((result) => (
          <div key={result.id + result.type} className="p-4 bg-white border rounded-lg hover:shadow-md transition cursor-pointer group">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        result.type === 'user' ? 'bg-blue-100 text-blue-700' :
                        result.type === 'transaction' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {result.type}
                    </span>
                    <h3 className="font-semibold text-base text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {result.title}
                    </h3>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                {result.created_at ? formatDistanceToNow(new Date(result.created_at), { addSuffix: true }) : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
