'use client'

import { AgencyCard } from '@/components/ui/agency-card'
import { DollarSign, CreditCard, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  payment_method?: string
  created_at: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  loading?: boolean
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <AgencyCard variant="glass" className="h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-neutral-500">Loading transactions...</div>
      </AgencyCard>
    )
  }

  return (
    <AgencyCard variant="glass" className="h-[400px] overflow-hidden flex flex-col">
      <div className="p-6 pb-2">
        <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
        <p className="text-sm text-neutral-400">Latest payments and refunds</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="text-center text-neutral-500 py-10">No recent transactions</div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  tx.status === 'succeeded' ? "bg-emerald-500/10 text-emerald-400" :
                  tx.status === 'pending' ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-red-500/10 text-red-400"
                )}>
                  {tx.status === 'succeeded' ? <CheckCircle2 className="w-5 h-5" /> :
                   tx.status === 'pending' ? <Clock className="w-5 h-5" /> :
                   <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {tx.status === 'succeeded' ? 'Payment Received' :
                     tx.status === 'pending' ? 'Payment Pending' : 'Payment Failed'}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatDate(tx.created_at)} • {tx.payment_method || 'Credit Card'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "font-medium",
                  tx.status === 'succeeded' ? "text-emerald-400" : "text-neutral-400"
                )}>
                  {tx.status === 'succeeded' ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </AgencyCard>
  )
}
