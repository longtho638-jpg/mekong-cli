'use client';

import React, { useState } from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3TextField } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function CacheKeysPage() {
  const [pattern, setPattern] = useState('*');
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<number[]>([0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cache-keys', pattern, cursor],
    queryFn: async () => {
      const res = await api.get(`/admin/cache/keys`, {
        params: { pattern, cursor, limit: 50 }
      });
      return res.data;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCursor(0);
    setHistory([0]);
    refetch();
  };

  const handleNext = () => {
    if (data?.cursor) {
      setHistory([...history, data.cursor]);
      setCursor(data.cursor);
    }
  };

  const handlePrev = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current
      const prevCursor = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCursor(prevCursor);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/cache" className="text-blue-600 hover:underline">Cache</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Keys</span>
          </div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Browse Keys</MD3Typography>
        </div>
      </div>

      <MD3Card variant="elevated" className="p-6">
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
          <div className="flex-1">
            <MD3TextField
              label="Key Pattern (e.g. user:*, api:*)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Match pattern..."
            />
          </div>
          <MD3Button type="submit" variant="filled" className="mt-2">
            <Search size={18} className="mr-2" />
            Search
          </MD3Button>
        </form>

        {isLoading ? (
          <div className="text-center py-10">Loading keys...</div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.keys?.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-gray-500">
                        No keys found matching pattern "{pattern}"
                      </td>
                    </tr>
                  ) : (
                    data?.keys?.map((key: string) => (
                      <tr key={key} className="hover:bg-white transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-700">{key}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/cache/keys/details?key=${encodeURIComponent(key)}`}>
                            <MD3Button variant="text" className="text-blue-600">Details</MD3Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <MD3Button
                variant="outlined"
                disabled={history.length <= 1}
                onClick={handlePrev}
              >
                <ChevronLeft size={18} className="mr-1" /> Previous
              </MD3Button>
              <span className="text-sm text-gray-500">
                {data?.keys?.length} results | Next Cursor: {data?.cursor}
              </span>
              <MD3Button
                variant="outlined"
                disabled={!data?.cursor || data?.cursor === 0}
                onClick={handleNext}
              >
                Next <ChevronRight size={18} className="ml-1" />
              </MD3Button>
            </div>
          </>
        )}
      </MD3Card>
    </div>
  );
}
