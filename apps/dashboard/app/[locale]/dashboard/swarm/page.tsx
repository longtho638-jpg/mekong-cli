'use client';

import React from 'react';
import { SwarmVisualizer } from '@/components/swarm/SwarmVisualizer';
import { MD3Text } from '@/components/md3-dna/MD3Text';

export default function SwarmPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--md-sys-color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] px-6 py-4">
        <div>
          <MD3Text variant="headline-medium" as="h1" className="text-[var(--md-sys-color-on-surface)]">
            Swarm Intelligence
          </MD3Text>
          <MD3Text variant="body-medium" className="text-[var(--md-sys-color-on-surface-variant)]">
            Real-time visualization of autonomous agent operations
          </MD3Text>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <SwarmVisualizer />
      </div>
    </div>
  );
}
