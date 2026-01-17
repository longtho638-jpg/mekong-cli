import { getDashboardData } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

// Mock client data (would come from API in production)
async function getClientData(email: string) {
  const data = await getDashboardData();
  const lead = data.leads.find((l) => l.email === email);

  if (!lead) return null;

  // Find invoices for this client
  const invoices = data.recent_sales.filter((s) => s.email === email);

  return {
    ...lead,
    invoices,
    totalSpent: invoices.reduce((sum, inv) => sum + inv.price, 0),
    projects: [
      { name: "Ghost CTO Lite", status: "active", startDate: "2026-01-15" },
    ],
  };
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const client = await getClientData(decodedEmail);

  if (!client) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/crm"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-slate-400">{client.company}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Mail className="text-blue-400" />}
          label="Email"
          value={client.email}
        />
        <StatCard
          icon={<DollarSign className="text-emerald-400" />}
          label="Total Spent"
          value={formatCurrency(client.totalSpent)}
        />
        <StatCard
          icon={<FolderOpen className="text-purple-400" />}
          label="Active Projects"
          value={client.projects.length.toString()}
        />
      </div>

      {/* Projects */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FolderOpen size={18} className="text-purple-400" />
          Active Projects
        </h2>
        <div className="space-y-4">
          {client.projects.map((project, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-4 rounded-lg bg-slate-950/50"
            >
              <div>
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-slate-400">
                  Started: {project.startDate}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                {project.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Invoices */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText size={18} className="text-emerald-400" />
          Payment History
        </h2>
        {client.invoices.length === 0 ? (
          <p className="text-slate-500">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {client.invoices.map((inv, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 rounded-lg bg-slate-950/50"
              >
                <div>
                  <div className="font-medium">{inv.product}</div>
                  <div className="text-sm text-slate-400">{inv.date}</div>
                </div>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(inv.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="flex gap-4">
        <Link
          href={`mailto:${client.email}`}
          className="flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-center font-bold transition"
        >
          Send Email
        </Link>
        <button className="flex-1 py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold transition">
          Generate Report
        </button>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="text-lg font-bold truncate">{value}</div>
    </div>
  );
}
