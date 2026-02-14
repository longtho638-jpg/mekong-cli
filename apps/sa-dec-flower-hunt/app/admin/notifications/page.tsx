"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Bell,
    MessageSquare,
    Mail,
    Package,
    AlertTriangle,
    Users,
    Truck,
    Terminal,
    CheckCircle,
    Settings,
    Zap,
    TestTube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NotificationConfig {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    channel: "whatsapp" | "email" | "zalo";
    enabled: boolean;
    tested: boolean;
}

export default function NotificationsHubPage() {
    const [configs, setConfigs] = useState<NotificationConfig[]>([
        {
            id: "order_farmer",
            title: "Đơn hàng mới → Thông báo Nông dân",
            description: "Khi có đơn mới, gửi WhatsApp/Zalo cho nông dân",
            icon: Package,
            channel: "whatsapp",
            enabled: true,
            tested: false
        },
        {
            id: "low_stock",
            title: "Tồn kho thấp → Email Nhà cung cấp",
            description: "Khi SKU < 10 đơn vị, gửi email cho supplier",
            icon: AlertTriangle,
            channel: "email",
            enabled: false,
            tested: false
        },
        {
            id: "new_farmer",
            title: "Nông dân mới → Chuỗi Welcome",
            description: "Gửi 3 email onboarding trong 7 ngày đầu",
            icon: Users,
            channel: "email",
            enabled: true,
            tested: false
        },
        {
            id: "delivery_update",
            title: "Cập nhật Vận chuyển → Thông báo Buyer",
            description: "Gửi Zalo khi đơn hàng đang giao",
            icon: Truck,
            channel: "zalo",
            enabled: false,
            tested: false
        }
    ]);

    const toggleConfig = (id: string) => {
        setConfigs(prev => prev.map(c =>
            c.id === id ? { ...c, enabled: !c.enabled } : c
        ));
        toast.success("Đã cập nhật cấu hình!");
    };

    const testConfig = (id: string) => {
        setConfigs(prev => prev.map(c =>
            c.id === id ? { ...c, tested: true } : c
        ));
        toast.success("Đã gửi test notification!", {
            description: "Kiểm tra channel đã cấu hình"
        });
    };

    const getChannelBadge = (channel: "whatsapp" | "email" | "zalo") => {
        const styles = {
            whatsapp: "bg-green-500/20 text-green-400 border-green-500/30",
            email: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            zalo: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
        };
        const labels = {
            whatsapp: "WhatsApp",
            email: "Email",
            zalo: "Zalo"
        };
        return (
            <span className={`text-[10px] px-2 py-0.5 rounded border ${styles[channel]}`}>
                {labels[channel]}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white font-mono p-6">
            {/* Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Bell className="w-6 h-6 text-emerald-500" />
                        <h1 className="text-2xl font-bold">NOTIFICATION_HUB</h1>
                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-xs text-emerald-400">
                            AUTOMATION
                        </span>
                    </div>
                    <p className="text-stone-500 text-sm">
                        Cấu hình thông báo tự động theo Playbook → Giảm 80% công việc thủ công
                    </p>
                </motion.div>

                {/* Notification Configs */}
                <div className="space-y-4 mb-8">
                    {configs.map((config, i) => (
                        <motion.div
                            key={config.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`
                                bg-stone-950 border rounded-lg p-5 transition-all
                                ${config.enabled
                                    ? 'border-emerald-500/50'
                                    : 'border-stone-800'}
                            `}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center
                                        ${config.enabled
                                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                                            : 'bg-stone-900 border border-stone-800'}
                                    `}>
                                        <config.icon className={`w-5 h-5 ${config.enabled ? 'text-emerald-400' : 'text-stone-600'}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white text-sm">
                                                {config.title}
                                            </h3>
                                            {getChannelBadge(config.channel)}
                                            {config.tested && (
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            )}
                                        </div>
                                        <p className="text-xs text-stone-500">
                                            {config.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => testConfig(config.id)}
                                        className="text-stone-500 hover:text-white text-xs"
                                    >
                                        <TestTube className="w-4 h-4 mr-1" />
                                        Test
                                    </Button>
                                    <Switch
                                        checked={config.enabled}
                                        onCheckedChange={() => toggleConfig(config.id)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Integration Setup */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-stone-950 border border-stone-800 rounded-lg p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold uppercase tracking-wider">
                            Cấu hình Kênh
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black border border-stone-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-bold text-white">WhatsApp</span>
                            </div>
                            <p className="text-[10px] text-stone-600 mb-3">
                                Kết nối WhatsApp Business API
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-stone-800 text-stone-500"
                            >
                                Cấu hình API
                            </Button>
                        </div>
                        <div className="bg-black border border-stone-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold text-white">Email</span>
                            </div>
                            <p className="text-[10px] text-stone-600 mb-3">
                                Kết nối SMTP hoặc Resend
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-stone-800 text-stone-500"
                            >
                                Cấu hình SMTP
                            </Button>
                        </div>
                        <div className="bg-black border border-stone-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-cyan-500" />
                                <span className="text-xs font-bold text-white">Zalo OA</span>
                            </div>
                            <p className="text-[10px] text-stone-600 mb-3">
                                Kết nối Zalo Official Account
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-stone-800 text-stone-500"
                            >
                                Cấu hình Zalo
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center text-stone-600 text-xs">
                    <p>Automation = Solo Founder Leverage • <span className="text-emerald-500">SOLO_1M_PLAYBOOK</span></p>
                </div>
            </div>
        </div>
    );
}
