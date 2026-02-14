"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Users, DollarSign } from "lucide-react";

export default function ProblemSlide() {
    const problems = [
        {
            icon: Users,
            title: "Nông Dân",
            subtitle: "Farmers",
            issues: [
                "Không tiếp cận tín dụng",
                "Canh tác thủ công",
                "Mất mùa = Phá sản"
            ],
            color: "emerald"
        },
        {
            icon: DollarSign,
            title: "Người Mua",
            subtitle: "Buyers",
            issues: [
                "Không truy xuất nguồn gốc",
                "Giá cao, chất lượng thấp",
                "Phụ thuộc trung gian"
            ],
            color: "amber"
        },
        {
            icon: TrendingDown,
            title: "Thị Trường",
            subtitle: "Market",
            issues: [
                "Phân mảnh nghiêm trọng",
                "0% số hóa",
                "Thua Trung Quốc & Thái Lan"
            ],
            color: "red"
        }
    ];

    const stats = [
        { label: "Total Market", value: "$1B", sublabel: "Vietnam flower industry" },
        { label: "Farms", value: "5,000+", sublabel: "Mekong Delta only" },
        { label: "Smartphone Adoption", value: "70%", sublabel: "Farmers have devices" },
        { label: "AgriTech Usage", value: "0%", sublabel: "Zero digitization" },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16">
            <div className="max-w-6xl w-full space-y-12">
                {/* Header */}
                <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wider">
                            The Problem
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-red-400">
                        Vietnam's $1B Flower Industry is Trapped Offline
                    </p>
                </motion.div>

                {/* 3-Column Problems */}
                <div className="grid md:grid-cols-3 gap-6">
                    {problems.map((problem, index) => {
                        const Icon = problem.icon;
                        const colorClasses = {
                            emerald: "border-emerald-500/30 bg-emerald-950/20",
                            amber: "border-amber-500/30 bg-amber-950/20",
                            red: "border-red-500/30 bg-red-950/20"
                        };
                        const textColors = {
                            emerald: "text-emerald-400",
                            amber: "text-amber-400",
                            red: "text-red-400"
                        };

                        return (
                            <motion.div
                                key={index}
                                className={`border rounded-sm p-6 ${colorClasses[problem.color as keyof typeof colorClasses]}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                            >
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <Icon className={`w-12 h-12 ${textColors[problem.color as keyof typeof textColors]}`} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{problem.title}</h3>
                                        <p className="text-xs text-stone-500 uppercase">{problem.subtitle}</p>
                                    </div>
                                    <ul className="space-y-2 text-sm text-stone-300">
                                        {problem.issues.map((issue, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-red-500">✗</span>
                                                <span>{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Stats Grid */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-stone-950/50 border border-stone-800 rounded-sm p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center space-y-1">
                            <div className="text-3xl font-bold text-white font-mono">{stat.value}</div>
                            <div className="text-xs text-emerald-500 uppercase tracking-wider">{stat.label}</div>
                            <div className="text-[10px] text-stone-600">{stat.sublabel}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
