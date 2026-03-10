import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Share2, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks';
import { referralService, NetworkNode } from '../services/referral-service';
import { NetworkTreeDesktop } from '../components/network/network-tree-desktop';
import { NetworkListMobile } from '../components/network/network-list-mobile';
import { useStore } from '../store';

/**
 * Page component for the referral network. Fetches and displays network stats,
 * and renders a tree visualization (desktop) or collapsible list (mobile).
 *
 * @returns The full network page with stats cards and adaptive tree/list views.
 */
const NetworkPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<unknown>(null);

  const [flatData, setFlatData] = useState<NetworkNode | null>(null); // Flat/Recursive format
  const [stats, setStats] = useState({
    totalDownlines: 0,
    f1Count: 0,
    totalTeamSales: 0,
    activeMembers: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsData = await referralService.getReferralStats(user?.id);
        setStats(statsData);

        // Fetch tree
        const rootNode = await referralService.getDownlineTree(user?.id);
        setFlatData(rootNode);

        if (rootNode) {
          const d3Data = referralService.transformToD3Tree(rootNode);
          setTreeData(d3Data);
        }
      } catch (err) {
        // Silent fail - error handled by error boundary
        setError('Failed to load network data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-400" />
            {t('nav.network') || 'Referral Network'}
          </h1>
          <p className="text-zinc-400 mt-1">
            Manage and visualize your team structure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-bold">Invite Member</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Total Downlines"
          value={stats.totalDownlines}
          icon={<Users className="w-4 h-4 text-blue-400" />}
          color="bg-blue-500/10 border-blue-500/20"
        />
        <StatsCard
          label="Direct (F1)"
          value={stats.f1Count}
          icon={<Share2 className="w-4 h-4 text-purple-400" />}
          color="bg-purple-500/10 border-purple-500/20"
        />
        <StatsCard
          label="Active Members"
          value={stats.activeMembers}
          icon={<Users className="w-4 h-4 text-emerald-400" />}
          color="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatsCard
          label="Team Volume"
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.totalTeamSales)}
          icon={<Users className="w-4 h-4 text-yellow-400" />}
          color="bg-yellow-500/10 border-yellow-500/20"
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tree Visualization */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mobile View */}
          <div className="block lg:hidden">
            {flatData ? (
              <NetworkListMobile node={flatData} />
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block h-[600px]">
            {treeData ? (
              <NetworkTreeDesktop data={treeData} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

/**
 * Displays a single statistic in a styled card with icon, label, and value.
 *
 * @param props - The component props.
 * @param props.label - The stat label text (e.g. "Total Downlines").
 * @param props.value - The stat value (string or number).
 * @param props.icon - A React node icon element to display.
 * @param props.color - Tailwind background and border color classes.
 * @returns A hover-animated stat card.
 */
const StatsCard = ({ label, value, icon, color }: StatsCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`p-4 rounded-2xl border backdrop-blur-md ${color}`}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-black/20">
        {icon}
      </div>
      <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">{label}</span>
    </div>
    <p className="text-xl md:text-2xl font-black text-white ml-1">{value}</p>
  </motion.div>
);


/**
 * Renders a placeholder UI when no network data is available,
 * prompting the user to invite members.
 *
 * @returns A centered empty state card with icon and message.
 */
const EmptyState = () => (
  <div className="w-full h-64 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/5">
    <Users className="w-12 h-12 text-zinc-600 mb-4" />
    <p className="text-zinc-400 font-medium">No network data available</p>
    <p className="text-zinc-600 text-sm mt-1">Start inviting members to build your team!</p>
  </div>
);

export default NetworkPage;
