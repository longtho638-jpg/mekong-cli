import React from 'react';
import CDNStats from '../../components/cdn-stats';
import PurgeForm from '../../components/purge-form';
import { MD3Typography } from '../../components/md3';

export default function CDNPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
      <div>
        <MD3Typography variant="display-small" className="mb-2">CDN Management</MD3Typography>
        <MD3Typography variant="body-large" className="text-gray-600">
            Manage Content Delivery Network, Cache, and Asset Optimization.
        </MD3Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
             <CDNStats />
             {/* Future: Optimization Stats */}
        </div>
        <div className="space-y-6">
            <PurgeForm />
        </div>
      </div>
    </div>
  );
}
