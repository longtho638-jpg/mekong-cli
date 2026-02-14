"use client";

import { useState, useEffect } from "react";
import {
    Package,
    LogOut,
    Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { PartnerLogin } from "@/components/partner/PartnerLogin";
import { PartnerStats } from "@/components/partner/PartnerStats";
import { OrderList, Order } from "@/components/partner/OrderList";

export default function PartnerDashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [phone, setPhone] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        revenue: 0,
        todayOrders: 0
    });

    // Check saved session
    useEffect(() => {
        const savedPhone = localStorage.getItem("partner_phone");
        if (savedPhone) {
            setPhone(savedPhone);
            setIsLoggedIn(true);
            fetchOrders(savedPhone);
        }
    }, []);

    const fetchOrders = async (partnerPhone: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/partner/orders?phone=${partnerPhone}`);
            const data = await res.json();

            if (data.orders) {
                setOrders(data.orders);

                // Calculate stats
                const pending = data.orders.filter((o: Order) => o.status === 'pending').length;
                const revenue = data.orders
                    .filter((o: Order) => o.status === 'delivered')
                    .reduce((sum: number, o: Order) => sum + o.price, 0);
                const today = data.orders.filter((o: Order) => {
                    const orderDate = new Date(o.created_at).toDateString();
                    return orderDate === new Date().toDateString();
                }).length;

                setStats({
                    total: data.orders.length,
                    pending,
                    revenue,
                    todayOrders: today
                });
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = (inputPhone: string) => {
        localStorage.setItem("partner_phone", inputPhone);
        setPhone(inputPhone);
        setIsLoggedIn(true);
        fetchOrders(inputPhone);
    };

    const handleLogout = () => {
        localStorage.removeItem("partner_phone");
        setIsLoggedIn(false);
        setPhone("");
        setOrders([]);
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await fetch("/api/partner/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: newStatus })
            });

            // Refresh orders
            fetchOrders(phone);

            // Celebration for delivered
            if (newStatus === 'delivered') {
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#22C55E', '#10B981', '#34D399']
                });
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    // Login Screen
    if (!isLoggedIn) {
        return <PartnerLogin onLogin={handleLogin} />;
    }

    // Dashboard
    return (
        <div className="min-h-screen bg-[#F8FAF8]">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Nhà Vườn
                        </h1>
                        <p className="text-green-100 text-sm">{phone}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-white/20 p-2 rounded-full"
                    >
                        <LogOut className="w-5 h-5 text-white" />
                    </button>
                </div>
            </header>

            {/* Farm OS Stats */}
            <div className="px-4 -mt-6 mb-6 relative z-10">
                <PartnerStats stats={stats} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 mb-6 grid grid-cols-2 gap-3">
                <button className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3 active:scale-95 transition-transform">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-stone-800 text-sm">Kho Hàng</p>
                        <p className="text-xs text-stone-500">Quản lý tồn kho</p>
                    </div>
                </button>
                <button className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3 active:scale-95 transition-transform">
                    <div className="bg-purple-50 p-2.5 rounded-xl">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-stone-800 text-sm">Marketing</p>
                        <p className="text-xs text-stone-500">Gửi tin nhắn</p>
                    </div>
                </button>
            </div>

            {/* Orders List */}
            <div className="px-4 pb-8">
                <h2 className="text-lg font-bold text-stone-800 mb-4">
                    Đơn Hàng ({orders.length})
                </h2>
                <OrderList
                    orders={orders}
                    isLoading={isLoading}
                    onUpdateStatus={updateOrderStatus}
                />
            </div>
        </div>
    );
}
