'use client';

import React, { useEffect, useState } from 'react';
import { MD3Card, MD3Typography, MD3Chip } from '../md3';

interface CDNConfig {
  provider: string;
  enabled: boolean;
  zone_id?: string;
  service_id?: string;
}

export default function CDNStats() {
  const [config, setConfig] = useState<CDNConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, use a proper fetch wrapper with auth
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/cdn/config'); // Assuming proxy setup or absolute URL
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Failed to fetch CDN config', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  if (loading) {
    return (
      <MD3Card className="p-6">
        <MD3Typography variant="body-large">Loading configuration...</MD3Typography>
      </MD3Card>
    );
  }

  if (!config) {
     return (
      <MD3Card className="p-6">
        <MD3Typography variant="body-large" className="text-red-500">Failed to load configuration.</MD3Typography>
      </MD3Card>
    );
  }

  return (
    <MD3Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <MD3Typography variant="headline-small">Configuration</MD3Typography>
        <MD3Chip
          label={config.enabled ? 'Enabled' : 'Disabled'}
          className={config.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <MD3Typography variant="label-medium" className="text-gray-500">Provider</MD3Typography>
          <MD3Typography variant="body-large" className="capitalize">{config.provider}</MD3Typography>
        </div>
        {config.zone_id && (
          <div>
            <MD3Typography variant="label-medium" className="text-gray-500">Zone ID</MD3Typography>
            <MD3Typography variant="body-large" className="font-mono">{config.zone_id}</MD3Typography>
          </div>
        )}
         {config.service_id && (
          <div>
            <MD3Typography variant="label-medium" className="text-gray-500">Service ID</MD3Typography>
            <MD3Typography variant="body-large" className="font-mono">{config.service_id}</MD3Typography>
          </div>
        )}
      </div>
    </MD3Card>
  );
}
