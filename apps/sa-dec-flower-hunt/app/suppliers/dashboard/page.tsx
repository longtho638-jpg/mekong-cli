"use client";

import { motion } from "framer-motion";
import { NodePulse } from "@/components/terminal/NodePulse";
import {
    Package,
    AlertTriangle,
    TrendingUp,
    Truck,
    Search,
    Filter,
    Box,
    Leaf
} from "lucide-react";
import { useState, useEffect } from "react";

interface InventoryItem {
    sku: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    price: number;
    unit: string;
    trend: "up" | "down" | "neutral";
}

const MOCK_INVENTORY: InventoryItem[] = [
    { sku: "NPK-20-20", name: "Phân NPK 20-20-20", category: "Phân bón", stock: 1250, minStock: 200, price: 45000, unit: "kg", trend: "up" },
    { sku: "SEED-CUC", name: "Hạt giống Cúc Mâm Xôi", category: "Giống", stock: 85, minStock: 100, price: 150000, unit: "gói", trend: "down" },
    { sku: "PIPE-25", name: "Ống tưới nhỏ giọt 25mm", category: "Thiết bị", stock: 500, minStock: 100, price: 25000, unit: "m", trend: "neutral" },
    { sku: "ORG-FERT", name: "Phân hữu cơ vi sinh", category: "Phân bón", stock: 45, minStock: 50, price: 85000, unit: "bao", trend: "down" },
    { sku: "SEED-MAI", name: "Giống Mai Vàng Bonsai", category: "Giống", stock: 320, minStock: 50, price: 250000, unit: "cây", trend: "up" },
    { sku: "PEST-BIO", name: "Thuốc trừ sâu sinh học", category: "Thuốc BVTV", stock: 780, minStock: 100, price: 120000, unit: "lít", trend: "neutral" },
];

const SUPPLIER_STATS = {
    totalSKU: 2341,
    lowStockItems: 23,
    jitDeliveryRate: 94,
    avgLeadTime: 2.5,
    monthlyOrders: 156,
    monthlyRevenue: 850000000,
};

export default function SuppliersDashboard() {
    const [currentTime, setCurrentTime] = useState("");
    const [inventory] = useState(MOCK_INVENTORY);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit", minute: "2-digit", second: "2-digit"
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatVND = (n: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", notation: "compact" }).format(n);

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLowStock = (item: InventoryItem) => item.stock < item.minStock;

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 font-mono p-6">
            {/* Header */}
            <motion.div
                className="mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 border border-orange-500/30 bg-orange-900/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-[0.15em] text-white">
                            SUPPLIER<span className="text-orange-400">_NODE</span>
                        </h1>
                        <div className="text-xs text-stone-500 tracking-wider flex items-center gap-2">
                            MARKETPLACE_VẬT_TƯ // THỜI_GIAN: <span className="text-white">{currentTime}</span>
                            <NodePulse size="sm" color="emerald" />
                            <span className="text-emerald-400">LIVE</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="text-xs text-stone-500 mb-1">TỔNG_SKU</div>
                    <div className="text-xl font-bold text-white">{SUPPLIER_STATS.totalSKU.toLocaleString()}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-red-500/30 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" /> TỒN_KHO_THẤP
                    </div>
                    <div className="text-xl font-bold text-red-400">{SUPPLIER_STATS.lowStockItems}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-emerald-500/30 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="text-xs text-stone-500 mb-1">TỶ_LỆ_GIAO_JIT</div>
                    <div className="text-xl font-bold text-emerald-400">{SUPPLIER_STATS.jitDeliveryRate}%</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="text-xs text-stone-500 mb-1">LEAD_TIME_TB</div>
                    <div className="text-xl font-bold text-white">{SUPPLIER_STATS.avgLeadTime} ngày</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-stone-800 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="text-xs text-stone-500 mb-1">ĐƠN_HÀNG_THÁNG</div>
                    <div className="text-xl font-bold text-white">{SUPPLIER_STATS.monthlyOrders}</div>
                </motion.div>
                <motion.div
                    className="bg-stone-900/50 border border-orange-500/30 rounded p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <div className="text-xs text-stone-500 mb-1">DOANH_THU_THÁNG</div>
                    <div className="text-xl font-bold text-orange-400">{formatVND(SUPPLIER_STATS.monthlyRevenue)}</div>
                </motion.div>
            </div>

            {/* Search Bar */}
            <motion.div
                className="mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm SKU hoặc tên sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-stone-900/50 border border-stone-800 rounded px-10 py-3 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-orange-500/50"
                    />
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                </div>
            </motion.div>

            {/* Inventory Table */}
            <motion.div
                className="bg-stone-900/50 border border-stone-800 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
            >
                <div className="p-4 border-b border-stone-800">
                    <h2 className="font-bold tracking-wider">BẢNG_TỒN_KHO</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-950/50">
                            <tr className="text-xs text-stone-500">
                                <th className="text-left p-3">SKU</th>
                                <th className="text-left p-3">TÊN_SẢN_PHẨM</th>
                                <th className="text-left p-3">LOẠI</th>
                                <th className="text-right p-3">TỒN_KHO</th>
                                <th className="text-right p-3">GIÁ</th>
                                <th className="text-center p-3">XU_HƯỚNG</th>
                                <th className="text-center p-3">TRẠNG_THÁI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map((item, index) => (
                                <motion.tr
                                    key={item.sku}
                                    className="border-t border-stone-800 hover:bg-stone-800/30 transition-colors"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 + index * 0.05 }}
                                >
                                    <td className="p-3 font-bold text-orange-400">{item.sku}</td>
                                    <td className="p-3 text-white">{item.name}</td>
                                    <td className="p-3 text-stone-400">{item.category}</td>
                                    <td className={`p-3 text-right font-bold ${isLowStock(item) ? 'text-red-400' : 'text-white'}`}>
                                        {item.stock} {item.unit}
                                    </td>
                                    <td className="p-3 text-right text-white">{formatVND(item.price)}</td>
                                    <td className="p-3 text-center">
                                        {item.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400 inline" />}
                                        {item.trend === "down" && <TrendingUp className="w-4 h-4 text-red-400 inline rotate-180" />}
                                        {item.trend === "neutral" && <span className="text-stone-500">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {isLowStock(item) ? (
                                            <span className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded">CẦN_NHẬP</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs rounded">ĐỦ_HÀNG</span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
