'use client';

import React, { useState } from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3TextField } from '@/components/md3';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Trash2, AlertTriangle, Tag, List, Key } from 'lucide-react';
import Link from 'next/link';

export default function InvalidateCachePage() {
  const queryClient = useQueryClient();
  const [key, setKey] = useState('');
  const [pattern, setPattern] = useState('');
  const [tags, setTags] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const invalidateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/cache/invalidate', data);
      return res.data;
    },
    onSuccess: (data) => {
      setResult(`Success! Removed ${data.keys_removed} keys.`);
      setKey('');
      setPattern('');
      setTags('');
      queryClient.invalidateQueries({ queryKey: ['cache-stats'] });
    },
    onError: (err: any) => {
      setResult(`Error: ${err.response?.data?.detail || err.message}`);
    }
  });

  const handleInvalidateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) return;
    invalidateMutation.mutate({ key });
  };

  const handleInvalidatePattern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern) return;
    if (confirm(`Are you sure you want to invalidate all keys matching "${pattern}"?`)) {
      invalidateMutation.mutate({ pattern });
    }
  };

  const handleInvalidateTags = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tags) return;
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    invalidateMutation.mutate({ tags: tagList });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/cache" className="text-blue-600 hover:underline">Cache</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Invalidate</span>
          </div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Invalidate Cache</MD3Typography>
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-lg mb-6 ${result.startsWith('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key Invalidation */}
        <MD3Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Key size={20} />
            </div>
            <MD3Typography variant="title-large">By Key</MD3Typography>
          </div>
          <p className="text-sm text-gray-500 mb-4">Remove a specific key from the cache.</p>
          <form onSubmit={handleInvalidateKey}>
            <MD3TextField
              label="Cache Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. user:123"
              className="mb-4"
            />
            <MD3Button type="submit" variant="filled" disabled={!key || invalidateMutation.isPending}>
              Invalidate Key
            </MD3Button>
          </form>
        </MD3Card>

        {/* Pattern Invalidation */}
        <MD3Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
              <List size={20} />
            </div>
            <MD3Typography variant="title-large">By Pattern</MD3Typography>
          </div>
          <p className="text-sm text-gray-500 mb-4">Remove all keys matching a pattern (slow).</p>
          <form onSubmit={handleInvalidatePattern}>
            <MD3TextField
              label="Pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. user:*"
              className="mb-4"
            />
            <MD3Button type="submit" variant="filled" className="bg-orange-600 hover:bg-orange-700" disabled={!pattern || invalidateMutation.isPending}>
              Invalidate Pattern
            </MD3Button>
          </form>
        </MD3Card>

        {/* Tag Invalidation */}
        <MD3Card variant="elevated" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Tag size={20} />
            </div>
            <MD3Typography variant="title-large">By Tags</MD3Typography>
          </div>
          <p className="text-sm text-gray-500 mb-4">Remove keys associated with tags (recommended).</p>
          <form onSubmit={handleInvalidateTags}>
            <MD3TextField
              label="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. user:123, product:99"
              className="mb-4"
            />
            <MD3Button type="submit" variant="filled" className="bg-purple-600 hover:bg-purple-700" disabled={!tags || invalidateMutation.isPending}>
              Invalidate Tags
            </MD3Button>
          </form>
        </MD3Card>
      </div>
    </div>
  );
}
