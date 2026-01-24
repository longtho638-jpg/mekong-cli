'use client';

import React from 'react';
import { OpsStatus } from '@/components/ops/OpsStatus';
import { ApprovalQueue } from '@/components/ops/ApprovalQueue';
import { MD3Text } from '@/components/md3-dna/MD3Text';

export default function OpsDashboardPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--md-sys-color-surface)] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] px-6 py-4">
        <div>
          <MD3Text variant="headline-medium" className="text-[var(--md-sys-color-on-surface)]">
            Mission Control
          </MD3Text>
          <MD3Text variant="body-medium" className="text-[var(--md-sys-color-on-surface-variant)]">
            System health and approval gates
          </MD3Text>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
        <section>
            <h2 className="text-title-large font-bold text-[var(--md-sys-color-on-surface)] mb-4">System Health</h2>
            <OpsStatus />
        </section>

        <section>
            <h2 className="text-title-large font-bold text-[var(--md-sys-color-on-surface)] mb-4">Approval Gates (Human-in-the-Loop)</h2>
            <ApprovalQueue />
        </section>
      </div>
    </div>
  );
}
