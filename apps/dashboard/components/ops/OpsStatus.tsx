'use client';

import React from 'react';
import { MD3Card } from '@/components/ui/MD3Card';
import { Activity, Server, AlertCircle, CheckCircle } from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  last_check: number;
  message?: string;
}

// Mock data for MVP
const MOCK_SERVICES: ServiceHealth[] = [
  { name: 'Database', status: 'healthy', last_check: Date.now() },
  { name: 'Swarm Engine', status: 'healthy', last_check: Date.now() },
  { name: 'Payment Gateway', status: 'degraded', last_check: Date.now(), message: 'High latency' },
  { name: 'Email Service', status: 'healthy', last_check: Date.now() },
];

export const OpsStatus: React.FC = () => {
  // In a real app, useSWR to fetch from /api/ops/status
  const services = MOCK_SERVICES;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {services.map((service) => (
        <MD3Card key={service.name} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-body-small text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
                {service.name}
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status={service.status} />
                <span className="text-title-medium font-bold capitalize text-[var(--md-sys-color-on-surface)]">
                  {service.status}
                </span>
              </div>
              {service.message && (
                <div className="mt-2 text-body-small text-[var(--md-sys-color-error)]">
                  {service.message}
                </div>
              )}
            </div>
            <Activity size={20} className="text-[var(--md-sys-color-outline)]" />
          </div>
          <div className="mt-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Last check: {new Date(service.last_check).toLocaleTimeString()}
          </div>
        </MD3Card>
      ))}
    </div>
  );
};

const StatusIcon = ({ status }: { status: ServiceHealth['status'] }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle size={18} className="text-green-500" />;
    case 'degraded':
      return <AlertCircle size={18} className="text-yellow-500" />;
    case 'unhealthy':
      return <AlertCircle size={18} className="text-red-500" />;
    default:
      return <Server size={18} className="text-gray-500" />;
  }
};
