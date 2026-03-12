import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { FadeIn } from '../animations/FadeIn';

export interface LicenseEntry {
  id: string;
  key: string;
  tier: string;
  status: 'active' | 'expiring' | 'expired' | 'suspended';
  customer: string;
  expiresAt: string;
  seats?: {
    used: number;
    total: number;
  };
}

export interface LicenseHealthTableProps {
  licenses: LicenseEntry[];
  title?: string;
  className?: string;
  onRowClick?: (license: LicenseEntry) => void;
  maxVisible?: number;
}

export const LicenseHealthTable: React.FC<LicenseHealthTableProps> = ({
  licenses,
  title = 'License Distribution',
  className,
  onRowClick,
  maxVisible = 5,
}) => {
  const statusStyles = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    expiring: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
    suspended: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const statusIcons = {
    active: '●',
    expiring: '⚠',
    expired: '○',
    suspended: '◌',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 30) return `Expires in ${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayedLicenses = licenses.slice(0, maxVisible);
  const remainingCount = licenses.length - maxVisible;

  return (
    <FadeIn direction="up">
      <GlassCard data-testid="license-health-table" className={cn('p-0 overflow-hidden', className)}>
        {title && (
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 text-xs text-gray-400 font-medium">
            <div className="col-span-3">License Key</div>
            <div className="col-span-2">Tier</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2 text-right">Expiration</div>
          </div>

          {/* Rows */}
          {displayedLicenses.map((license, index) => (
            <motion.div
              key={license.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                'grid grid-cols-12 gap-4 px-6 py-4 text-sm',
                'hover:bg-white/5 transition-colors cursor-pointer',
                onRowClick ? '' : 'cursor-default'
              )}
              onClick={() => onRowClick?.(license)}
            >
              {/* License Key */}
              <div className="col-span-3">
                <code className="text-xs px-2 py-1 rounded bg-white/5 text-gray-300 font-mono">
                  {license.key}
                </code>
              </div>

              {/* Tier */}
              <div className="col-span-2 flex items-center">
                <span className="text-gray-300">{license.tier}</span>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center">
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full border font-medium',
                    statusStyles[license.status]
                  )}
                >
                  {statusIcons[license.status]} {license.status}
                </span>
              </div>

              {/* Customer */}
              <div className="col-span-3 flex items-center">
                <span className="text-gray-300 truncate" title={license.customer}>
                  {license.customer}
                </span>
              </div>

              {/* Expiration */}
              <div className="col-span-2 flex items-center justify-end">
                <span
                  className={cn(
                    'text-xs font-medium',
                    license.status === 'expired'
                      ? 'text-red-400'
                      : license.status === 'expiring'
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  )}
                >
                  {formatDate(license.expiresAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Seats summary for each license (optional detail) */}
        {licenses.some((l) => l.seats) && (
          <div className="border-t border-white/5 px-6 py-4 bg-white/5">
            <div className="space-y-2">
              {displayedLicenses
                .filter((l) => l.seats)
                .map((license) => (
                  <div key={license.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono">{license.key}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(license.seats!.used / license.seats!.total) * 100}%`,
                          }}
                          transition={{ duration: 0.5 }}
                          className={cn(
                            'h-full rounded-full',
                            license.seats!.used >= license.seats!.total
                              ? 'bg-red-500'
                              : license.seats!.used >= license.seats!.total * 0.8
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          )}
                        />
                      </div>
                      <span className="text-gray-300">
                        {license.seats!.used}/{license.seats!.total} seats
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Show more indicator */}
        {remainingCount > 0 && (
          <div className="px-6 py-3 border-t border-white/5 bg-white/5">
            <p className="text-xs text-gray-400 text-center">
              +{remainingCount} more license{remainingCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </GlassCard>
    </FadeIn>
  );
};
