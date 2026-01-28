'use client';

import React, { useState } from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3TextField, MD3Dialog } from '../md3';

export default function PurgeForm() {
  const [purgeType, setPurgeType] = useState<'all' | 'urls' | 'tags'>('all');
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const handlePurge = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      if (purgeType === 'all') {
        payload.purge_all = true;
      } else if (purgeType === 'urls') {
        payload.urls = inputVal.split('\n').map(s => s.trim()).filter(Boolean);
      } else if (purgeType === 'tags') {
        payload.tags = inputVal.split('\n').map(s => s.trim()).filter(Boolean);
      }

      const res = await fetch('/api/cdn/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setResultMsg(data.message || 'Purge initiated successfully');
      } else {
        const err = await res.json();
        setResultMsg(`Error: ${err.detail || 'Unknown error'}`);
      }
    } catch (error: any) {
      setResultMsg(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setDialogOpen(true);
    }
  };

  return (
    <MD3Card className="p-6 space-y-6">
      <MD3Typography variant="headline-small">Cache Controls</MD3Typography>

      <div className="flex gap-2">
        <MD3Button
          variant={purgeType === 'all' ? 'filled' : 'outlined'}
          onClick={() => setPurgeType('all')}
        >
          Purge All
        </MD3Button>
        <MD3Button
          variant={purgeType === 'urls' ? 'filled' : 'outlined'}
          onClick={() => setPurgeType('urls')}
        >
          Purge URLs
        </MD3Button>
        <MD3Button
          variant={purgeType === 'tags' ? 'filled' : 'outlined'}
          onClick={() => setPurgeType('tags')}
        >
          Purge Tags
        </MD3Button>
      </div>

      {purgeType !== 'all' && (
        <MD3TextField
            label={purgeType === 'urls' ? "URLs (one per line)" : "Tags (one per line)"}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            multiline
            rows={4}
            placeholder={purgeType === 'urls' ? "https://example.com/image.png" : "user-123"}
        />
      )}

      <div className="flex justify-end">
        <MD3Button
            onClick={handlePurge}
            disabled={loading || (purgeType !== 'all' && !inputVal.trim())}
            color="error" // Warning color for purge
            variant="filled"
        >
            {loading ? 'Processing...' : 'Execute Purge'}
        </MD3Button>
      </div>

      <MD3Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Purge Result"
        actions={
            <MD3Button onClick={() => setDialogOpen(false)} variant="text">Close</MD3Button>
        }
      >
        <p>{resultMsg}</p>
      </MD3Dialog>

    </MD3Card>
  );
}
