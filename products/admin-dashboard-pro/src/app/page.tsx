import { getDashboardData } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { ArrowUpRight, Users, DollarSign, Calendar } from "lucide-react";

export const revalidate = 0; // Disable cache for real-time

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.revenue)}
          icon={<DollarSign className="text-emerald-400" />}
          trend="+12%"
          bg="bg-gradient-to-br from-emerald-950/50 to-emerald-900/20 border-emerald-800/30"
        />
        <StatCard
          title="Active Leads"
          value={data.leads_count.toString()}
          icon={<Users className="text-blue-400" />}
          trend="+3 new"
          bg="bg-gradient-to-br from-blue-950/50 to-blue-900/20 border-blue-800/30"
        />
        <StatCard
          title="Content Queue"
          value={data.queue_count.toString()}
          icon={<Calendar className="text-purple-400" />}
          trend="Next: Tomorrow"
          bg="bg-gradient-to-br from-purple-950/50 to-purple-900/20 border-purple-800/30"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-400" /> Recent
            Transactions
          </h2>
          <div className="flex flex-col gap-0">
            {data.recent_sales.length === 0 ? (
              <div className="text-slate-500 text-sm py-4">
                No recent sales.
              </div>
            ) : (
              data.recent_sales.map((sale, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-4 border-b border-slate-800/50 last:border-0"
                >
                  <div>
                    <div className="font-medium text-slate-200">
                      {sale.product}
                    </div>
                    <div className="text-xs text-slate-500">
                      {sale.email} • {sale.date}
                    </div>
                  </div>
                  <div className="font-bold text-emerald-400">
                    {formatCurrency(sale.price)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Feed / Queue */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" /> Content Schedule
          </h2>
          <div className="flex flex-col gap-4">
            {data.queue.length === 0 ? (
              <div className="text-slate-500 text-sm py-4">Queue empty.</div>
            ) : (
              data.queue.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start p-3 rounded-lg bg-slate-950/50"
                >
                  <div className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded">
                    {item.date}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200 mb-1">
                      {item.theme}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-2">
                      {item.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  bg,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  bg: string;
}) {
  return (
    <div
      className={cn(
        "p-6 rounded-xl border flex flex-col gap-4 relative overflow-hidden",
        bg,
      )}
    >
      <div className="flex justify-between items-start z-10">
        <div className="bg-slate-950/30 p-2 rounded-lg">{icon}</div>
        <div className="text-xs font-bold bg-slate-950/30 px-2 py-1 rounded-full text-slate-300 flex items-center gap-1">
          {trend} <ArrowUpRight size={12} />
        </div>
      </div>
      <div className="z-10">
        <div className="text-slate-400 text-sm font-medium">{title}</div>
        <div className="text-3xl font-bold mt-1 text-white">{value}</div>
      </div>
    </div>
  );
}
