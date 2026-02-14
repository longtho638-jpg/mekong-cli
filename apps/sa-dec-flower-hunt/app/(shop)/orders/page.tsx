"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Clock,
    CheckCircle,
    Truck,
    XCircle,
    Loader2,
    ShoppingBag,
    LogIn
} from "lucide-react";
import { LoginModal } from "@/components/LoginModal";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Order {
    id: string;
    flower_name: string;
    size: string;
    quantity: number;
    price: number;
    status: string;
    address: string;
    created_at: string;
}

const STATUS_CONFIG = {
    pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
    shipped: { label: "Đang giao", color: "bg-purple-100 text-purple-700", icon: Truck },
    delivered: { label: "Đã giao", color: "bg-green-100 text-green-700", icon: CheckCircle },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: XCircle }
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsLoggedIn(true);
            setUserEmail(session.user.email || "");
            fetchOrders();
        } else {
            setIsLoggedIn(false);
            setIsLoading(false);
        }
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/orders`);
            if (res.status === 401) {
                setIsLoggedIn(false);
                return;
            }
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
            setIsLoggedIn(false);
            setOrders([]);
            setUserEmail("");
        }
    };

    // Login Screen (Guest State)
    if (!isLoading && !isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#FDFBF7]">
                <LoginModal isOpen={showLoginModal} onClose={() => { setShowLoginModal(false); checkAuth(); }} />

                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-4 border-b border-stone-100 flex items-center gap-3">
                    <Link href="/" className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                        <ChevronLeft className="w-6 h-6 text-stone-600" />
                    </Link>
                    <h1 className="text-xl font-bold text-stone-800">Đơn Hàng Của Tôi</h1>
                </header>

                <div className="px-6 pt-12">
                    <div className="text-center mb-8">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl mb-4"
                        >
                            🔐
                        </motion.div>
                        <h2 className="text-xl font-bold text-stone-800 mb-2">Đăng nhập để xem</h2>
                        <p className="text-stone-500 mb-6">
                            Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.
                        </p>
                        
                        <Button 
                            onClick={() => setShowLoginModal(true)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg rounded-xl shadow-lg"
                        >
                            <LogIn className="w-5 h-5 mr-2" />
                            Đăng nhập / Đăng ký
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Orders List (Authenticated)
    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-8">
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                        <ChevronLeft className="w-6 h-6 text-stone-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-stone-800">Đơn Hàng</h1>
                        <p className="text-xs text-stone-500 truncate max-w-[150px]">{userEmail}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm text-red-500 font-bold"
                >
                    Đăng xuất
                </button>
            </header>

            <div className="px-4 pt-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-stone-600 mb-2">Chưa có đơn hàng</h2>
                        <p className="text-stone-400 text-sm mb-6">
                            Bạn chưa có đơn hàng nào.
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition-colors"
                        >
                            Mua Hoa Ngay
                        </Link>
                    </div>
                ) : (
                    <AnimatePresence>
                        {orders.map((order, index) => {
                            const statusInfo = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                            const StatusIcon = statusInfo.icon;

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-stone-100"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-stone-800">{order.flower_name}</h3>
                                            <p className="text-sm text-stone-500">
                                                Size {order.size} × {order.quantity}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusInfo.label}
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="flex gap-1 mb-3">
                                        {['pending', 'confirmed', 'shipped', 'delivered'].map((step, i) => {
                                            const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
                                            const currentStep = steps.indexOf(order.status);
                                            const isActive = i <= currentStep && order.status !== 'cancelled';

                                            return (
                                                <div
                                                    key={step}
                                                    className={`flex-1 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-stone-200'
                                                        }`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-stone-400">{formatDate(order.created_at)}</p>
                                        <p className="text-lg font-bold text-red-600">{formatPrice(order.price)}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
