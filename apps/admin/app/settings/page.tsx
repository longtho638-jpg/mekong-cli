'use client';

import React from 'react';
import { MD3Card, MD3Typography, MD3Button } from '@/components/md3';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Save, RefreshCw } from 'lucide-react';

interface FeatureFlagRow {
    key: string;
    description: string;
    is_enabled: boolean;
}

interface SettingRow {
    key: string;
    value: string;
    description: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery<SettingRow[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data;
    }
  });

  const { data: flags } = useQuery<FeatureFlagRow[]>({
      queryKey: ['admin-feature-flags'],
      queryFn: async () => {
          const res = await api.get('/admin/settings/feature-flags');
          return res.data;
      }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Settings</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">System configuration and feature flags</MD3Typography>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MD3Card variant="elevated" className="p-6">
            <div className="flex justify-between items-center mb-6">
                <MD3Typography variant="title-large">Feature Flags</MD3Typography>
                <MD3Button variant="text" size="small" startIcon={<RefreshCw size={14} />}>Refresh</MD3Button>
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className="space-y-4">
                    {flags?.map((flag: FeatureFlagRow) => (
                        <div key={flag.key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">{flag.key}</div>
                                <div className="text-xs text-gray-500">{flag.description}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={flag.is_enabled} className="sr-only peer" readOnly />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                    {(!flags || flags.length === 0) && (
                        <div className="text-center text-gray-500 py-4">No feature flags found</div>
                    )}
                </div>
            )}
        </MD3Card>

        <MD3Card variant="elevated" className="p-6">
            <MD3Typography variant="title-large" className="mb-6">System Configuration</MD3Typography>
            <div className="space-y-4">
                {settings?.map((setting: SettingRow) => (
                    <div key={setting.key} className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">{setting.key}</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={setting.value}
                        />
                         <div className="text-xs text-gray-500">{setting.description}</div>
                    </div>
                ))}

                <div className="pt-4 flex justify-end">
                    <MD3Button startIcon={<Save size={16} />}>Save Changes</MD3Button>
                </div>
            </div>
        </MD3Card>
      </div>
    </div>
  );
}
