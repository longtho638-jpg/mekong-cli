"use client";

import { TrendingUp } from "lucide-react";
import { PartnerRevenueChart } from "@/components/partner/PartnerRevenueChart";

interface PartnerStatsProps {
    stats: {
        total: number;
        pending: number;
        revenue: number;
        todayOrders: number;
    };
}

export function PartnerStats({ stats }: PartnerStatsProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    return (
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-green-50">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm text-stone-500 font-medium">Doanh thu tuần này</p>
                    <h2 className="text-3xl font-bold text-stone-900">{formatPrice(stats.revenue)}</h2>
                </div>
                <div className="bg-green-50 p-2 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
            </div>

            {/* Chart */}
            <PartnerRevenueChart />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-100">
                <div className="text-center">
                    <p className="text-2xl font-bold text-stone-800">{stats.pending}</p>
                    <p className="text-xs text-stone-500 font-medium">Chờ xử lý</p>
                </div>
                <div className="text-center border-l border-stone-100">
                    <p className="text-2xl font-bold text-stone-800">{stats.todayOrders}</p>
                    <p className="text-xs text-stone-500 font-medium">Hôm nay</p>
                </div>
                <div className="text-center border-l border-stone-100">
                    <p className="text-2xl font-bold text-stone-800">{stats.total}</p>
                    <p className="text-xs text-stone-500 font-medium">Tổng đơn</p>
                </div>
            </div>
        </div>
    );
}
