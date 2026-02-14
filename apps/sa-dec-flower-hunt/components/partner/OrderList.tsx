"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, Truck, XCircle, Phone, MapPin, Package, Loader2 } from "lucide-react";

export interface Order {
    id: string;
    flower_name: string;
    size: string;
    quantity: number;
    price: number;
    status: string;
    customer_name: string;
    customer_phone: string;
    address: string;
    notes: string;
    created_at: string;
}

const STATUS_CONFIG = {
    pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
    shipped: { label: "Đang giao", color: "bg-purple-100 text-purple-700", icon: Truck },
    delivered: { label: "Đã giao", color: "bg-green-100 text-green-700", icon: CheckCircle },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: XCircle }
};

interface OrderListProps {
    orders: Order[];
    isLoading: boolean;
    onUpdateStatus: (orderId: string, status: string) => void;
}

export function OrderList({ orders, isLoading, onUpdateStatus }: OrderListProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl">
                <Package className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-500">Chưa có đơn hàng nào</p>
            </div>
        );
    }

    return (
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
                        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
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

                        {/* Customer Info */}
                        <div className="bg-stone-50 rounded-xl p-3 mb-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-stone-400" />
                                <span className="text-stone-700">{order.customer_name} - {order.customer_phone}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-stone-400 mt-0.5" />
                                <span className="text-stone-600">{order.address}</span>
                            </div>
                            {order.notes && (
                                <p className="text-xs text-stone-500 italic">📝 {order.notes}</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg font-bold text-green-600">{formatPrice(order.price)}</p>
                                <p className="text-xs text-stone-400">{formatDate(order.created_at)}</p>
                            </div>

                            {/* Action Buttons */}
                            {order.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onUpdateStatus(order.id, 'cancelled')}
                                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold"
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(order.id, 'confirmed')}
                                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold"
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            )}

                            {order.status === 'confirmed' && (
                                <button
                                    onClick={() => onUpdateStatus(order.id, 'shipped')}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-1"
                                >
                                    <Truck className="w-4 h-4" />
                                    Giao hàng
                                </button>
                            )}

                            {order.status === 'shipped' && (
                                <button
                                    onClick={() => onUpdateStatus(order.id, 'delivered')}
                                    className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold flex items-center gap-1"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Đã giao
                                </button>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </AnimatePresence>
    );
}
