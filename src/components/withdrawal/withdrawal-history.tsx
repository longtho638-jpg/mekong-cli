import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks';
import { withdrawalService, WithdrawalRequest } from '../../services/withdrawal-service';
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatVND } from '../../utils/format';

/**
 * Displays a scrollable list of past withdrawal requests with status badges.
 * Automatically refreshes when a 'withdrawal-created' custom event is dispatched.
 *
 * @returns A card containing the transaction history or a loading/empty state.
 *
 * @example
 * ```tsx
 * <WithdrawalHistory />
 * ```
 */
export const WithdrawalHistory: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  /** Fetches the user's withdrawal history from the API and updates local state. */
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await withdrawalService.getUserWithdrawals();
      setRequests(data);
    } catch (error) {
      // Silent fail - error handled by error boundary
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Listen for custom event to refresh list
    const handleRefresh = () => fetchHistory();
    window.addEventListener('withdrawal-created', handleRefresh);

    return () => {
      window.removeEventListener('withdrawal-created', handleRefresh);
    };
  }, []);

  /**
   * Returns a styled status badge element for the given withdrawal status.
   *
   * @param status - The withdrawal status string ('completed', 'rejected', 'cancelled', or pending).
   * @returns A JSX badge element with appropriate color and icon.
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
            <CheckCircle2 className="w-3 h-3" />
            {t('common.success') || 'Completed'}
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full border border-red-400/20">
            <XCircle className="w-3 h-3" />
            {t('common.failed') || 'Rejected'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-500/10 px-2 py-1 rounded-full border border-zinc-500/20">
            <AlertCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
            <Clock className="w-3 h-3" />
            {t('common.pending') || 'Pending'}
          </span>
        );
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl h-full min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">{t('withdrawal.historyTitle') || 'Transaction History'}</h3>
        <button
          onClick={fetchHistory}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
            <Clock className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          requests.map((req, idx) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-bold">{formatVND(req.amount)}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(req.requested_at).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 pt-2 border-t border-white/5 mt-2">
                <span className="font-medium text-zinc-300">{req.bank_name}</span>
                <span>•</span>
                <span>**** {req.bank_account_number.slice(-4)}</span>
              </div>

              {req.status === 'rejected' && req.rejection_reason && (
                <div className="mt-2 text-xs text-red-300 bg-red-500/10 p-2 rounded-lg">
                  Note: {req.rejection_reason}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
