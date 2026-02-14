import { LucideIcon } from "lucide-react";

interface KPICardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    color: "green" | "blue" | "purple" | "orange" | string;
}

export function KPICard({ icon, label, value, sub, color }: KPICardProps) {
    const borderColor = {
        green: "border-green-900/30",
        blue: "border-blue-900/30",
        purple: "border-purple-900/30",
        orange: "border-orange-900/30",
    }[color] || "border-stone-800";

    const glowColor = {
        green: "shadow-green-900/20",
        blue: "shadow-blue-900/20",
        purple: "shadow-purple-900/20",
        orange: "shadow-orange-900/20",
    }[color];

    return (
        <div className={`bg-stone-900/50 border ${borderColor} p-6 rounded-xl hover:bg-stone-900 transition-all shadow-lg ${glowColor}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-stone-950 border border-stone-800`}>
                    {icon}
                </div>
                <Badge color={color} />
            </div>
            <div>
                <p className="text-stone-400 text-xs uppercase tracking-wider font-bold">{label}</p>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{value}</p>
                <p className="text-stone-500 text-xs mt-1">{sub}</p>
            </div>
        </div>
    );
}

function Badge({ color }: { color: string }) {
    const bg = {
        green: "bg-green-500",
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        orange: "bg-orange-500",
    }[color] || "bg-stone-500";

    return (
        <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bg} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${bg}`}></span>
        </span>
    )
}
