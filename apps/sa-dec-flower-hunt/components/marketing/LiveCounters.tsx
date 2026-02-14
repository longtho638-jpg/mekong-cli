"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, Users, DollarSign, Clock, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PlatformMetrics {
    farmers: number;
    orders: number;
    revenue: number;
    products: number;
    leads: number;
    isLoading: boolean;
    error: string | null;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix: string }) {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (!isInView) return;

        const duration = 2000;
        const steps = 60;
        const stepDuration = duration / steps;
        let current = 0;

        const timer = setInterval(() => {
            current++;
            const progress = current / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(value * eased);

            if (current >= steps) {
                clearInterval(timer);
                setDisplayValue(value);
            }
        }, stepDuration);

        return () => clearInterval(timer);
    }, [isInView, value]);

    const formatValue = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
        if (val >= 1000) return Math.floor(val).toLocaleString();
        if (val % 1 !== 0) return val.toFixed(1);
        return Math.floor(val).toString();
    };

    return (
        <span ref={ref} className="tabular-nums">
            {prefix}{formatValue(displayValue)}{suffix}
        </span>
    );
}

export function LiveCounters() {
    const [metrics, setMetrics] = useState<PlatformMetrics>({
        farmers: 0,
        orders: 0,
        revenue: 0,
        products: 0,
        leads: 0,
        isLoading: true,
        error: null,
    });
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchMetrics = useCallback(async () => {
        if (!supabase) {
            // Fallback to demo values if no Supabase
            setMetrics({
                farmers: 47,
                orders: 1402,
                revenue: 2400000000,
                products: 156,
                leads: 89,
                isLoading: false,
                error: "Demo mode"
            });
            return;
        }

        try {
            // Parallel queries for real data
            const [farmersResult, ordersResult, productsResult, leadsResult] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'farmer'),
                supabase.from('orders').select('id, final_price', { count: 'exact' }),
                supabase.from('products').select('id', { count: 'exact' }).eq('status', 'active'),
                supabase.from('leads').select('id', { count: 'exact' }),
            ]);

            const orders = ordersResult.data || [];
            const totalRevenue = orders.reduce((sum, o) => sum + (o.final_price || 0), 0);

            setMetrics({
                farmers: farmersResult.count || 0,
                orders: ordersResult.count || 0,
                revenue: totalRevenue,
                products: productsResult.count || 0,
                leads: leadsResult.count || 0,
                isLoading: false,
                error: null,
            });
            setLastUpdate(new Date());

        } catch (error: any) {
            console.error("LiveCounters fetch error:", error);
            // Graceful fallback
            setMetrics(prev => ({
                ...prev,
                isLoading: false,
                error: error.message
            }));
        }
    }, []);

    useEffect(() => {
        fetchMetrics();

        // Refresh every 30 seconds as fallback
        const interval = setInterval(fetchMetrics, 30000);

        // Add real-time subscriptions for instant updates
        if (supabase) {
            const ordersChannel = supabase
                .channel('landing-orders')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'orders' },
                    () => {
                        console.log('📦 Order change detected - refreshing');
                        fetchMetrics();
                    }
                )
                .subscribe();

            const productsChannel = supabase
                .channel('landing-products')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'products' },
                    () => {
                        console.log('🌸 Product change detected - refreshing');
                        fetchMetrics();
                    }
                )
                .subscribe();

            const leadsChannel = supabase
                .channel('landing-leads')
                .on('postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'leads' },
                    () => {
                        console.log('📝 New lead detected - refreshing');
                        fetchMetrics();
                    }
                )
                .subscribe();

            return () => {
                clearInterval(interval);
                supabase?.removeChannel(ordersChannel);
                supabase?.removeChannel(productsChannel);
                supabase?.removeChannel(leadsChannel);
            };
        }

        return () => clearInterval(interval);
    }, [fetchMetrics]);

    // Format revenue as billion VND
    const revenueInBillion = metrics.revenue / 1000000000;

    const counters = [
        {
            id: "farmers",
            icon: Users,
            value: metrics.farmers,
            suffix: "+",
            label: "Nhà Vườn",
            trend: "Live",
            trendUp: true
        },
        {
            id: "gmv",
            icon: DollarSign,
            value: revenueInBillion || 0,
            suffix: "B",
            prefix: "₫",
            label: "GMV",
            trend: lastUpdate ? `${lastUpdate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : "...",
            trendUp: true
        },
        {
            id: "orders",
            icon: CheckCircle,
            value: metrics.orders,
            suffix: "",
            label: "Đơn Hàng",
            trend: "Total",
            trendUp: true
        },
        {
            id: "products",
            icon: TrendingUp,
            value: metrics.products,
            suffix: "",
            label: "Sản Phẩm",
            trend: "Active",
            trendUp: true
        },
        {
            id: "leads",
            icon: Clock,
            value: metrics.leads,
            suffix: "",
            label: "Leads",
            trend: "Pipeline",
            trendUp: true
        },
    ];

    return (
        <section className="py-10">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-emerald-950/50 via-stone-950 to-emerald-950/50 border border-emerald-500/20 rounded-lg py-6"
                >
                    {/* Live indicator */}
                    <div className="text-center mb-4">
                        <span className="inline-flex items-center gap-2 text-[9px] font-mono text-stone-500">
                            {metrics.isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                            {metrics.error ? `[${metrics.error}]` : "LIVE DATA FROM SUPABASE"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 px-6">
                        {counters.map((counter, i) => (
                            <motion.div
                                key={counter.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <counter.icon className="w-4 h-4 text-emerald-500/50" />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-white font-mono">
                                    {metrics.isLoading ? (
                                        <span className="text-stone-600">...</span>
                                    ) : (
                                        <AnimatedNumber
                                            value={counter.value}
                                            prefix={counter.prefix}
                                            suffix={counter.suffix}
                                        />
                                    )}
                                </div>
                                <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                                    {counter.label}
                                </div>
                                <div className={`text-[9px] font-mono ${counter.trendUp ? "text-emerald-400" : "text-red-400"}`}>
                                    {counter.trend}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
