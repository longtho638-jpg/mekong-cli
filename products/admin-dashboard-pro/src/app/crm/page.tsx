import { getDashboardData, Lead } from "@/lib/api";
import { Users, Mail, Phone, CheckCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 0;

export default async function CRMPage() {
  const data = await getDashboardData();
  const leads = data.leads;

  const newLeads = leads.filter((l) => l.stage === "new");
  const workingLeads = leads.filter((l) =>
    ["contacted", "replied"].includes(l.stage),
  );
  const closedLeads = leads.filter((l) => l.stage === "closed");

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Users className="text-blue-400" /> Pipeline
      </h2>

      <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
        <KanbanColumn
          title="New Leads"
          count={newLeads.length}
          color="border-t-blue-500"
        >
          {newLeads.map((l, i) => (
            <LeadCard key={i} lead={l} />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="In Progress"
          count={workingLeads.length}
          color="border-t-yellow-500"
        >
          {workingLeads.map((l, i) => (
            <LeadCard key={i} lead={l} />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Closed Won"
          count={closedLeads.length}
          color="border-t-emerald-500"
        >
          {closedLeads.map((l, i) => (
            <LeadCard key={i} lead={l} />
          ))}
        </KanbanColumn>
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  children,
  color,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className={cn(
        "bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-full",
        color,
        "border-t-4",
      )}
    >
      <div className="p-4 border-b border-slate-800/50 flex justify-between items-center">
        <h3 className="font-bold text-slate-200">{title}</h3>
        <span className="bg-slate-800 text-xs px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1 scrollbar-hide">
        {children}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors rounded-lg group cursor-pointer shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-slate-200 text-sm">{lead.name}</div>
        <Link
          href={`/client/${encodeURIComponent(lead.email)}`}
          className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition"
          title="View Client"
        >
          <ExternalLink size={12} className="text-blue-400" />
        </Link>
      </div>
      <div className="text-xs text-slate-400 font-medium mb-3">
        {lead.company}
      </div>

      <div className="flex gap-2 text-slate-500">
        <a
          href={`mailto:${lead.email}`}
          className="p-1.5 hover:bg-slate-800 rounded bg-slate-900/50"
          title="Email"
        >
          <Mail size={12} />
        </a>
        <button
          className="p-1.5 hover:bg-slate-800 rounded bg-slate-900/50"
          title="Log Call"
        >
          <Phone size={12} />
        </button>
        <button
          className="p-1.5 hover:bg-slate-800 rounded bg-slate-900/50"
          title="Close Deal"
        >
          <CheckCircle size={12} />
        </button>
      </div>
    </div>
  );
}
