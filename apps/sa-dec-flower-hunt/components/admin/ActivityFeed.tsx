"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, UserPlus, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityItem {
    id: string;
    type: 'order' | 'farmer' | 'lead' | 'alert';
    title: string;
    description?: string;
    timestamp: string;
    amount?: number;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    maxHeight?: string;
}

const iconMap = {
    order: ShoppingBag,
    farmer: UserPlus,
    lead: Sparkles,
    alert: AlertCircle
};

const colorMap = {
    order: 'text-green-500 bg-green-50',
    farmer: 'text-blue-500 bg-blue-50',
    lead: 'text-purple-500 bg-purple-50',
    alert: 'text-red-500 bg-red-50'
};

export function ActivityFeed({ activities, maxHeight = "400px" }: ActivityFeedProps) {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <Card className="border-stone-200">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Hoạt động Live
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea style={{ maxHeight }}>
                    <AnimatePresence>
                        {activities.length === 0 ? (
                            <p className="text-center text-stone-400 py-8">Chưa có hoạt động</p>
                        ) : (
                            <div className="space-y-3">
                                {activities.map((activity, idx) => {
                                    const Icon = iconMap[activity.type];
                                    const colorClass = colorMap[activity.type];

                                    return (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
                                        >
                                            <div className={`p-2 rounded-full ${colorClass}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-stone-900 truncate">
                                                    {activity.title}
                                                </p>
                                                {activity.description && (
                                                    <p className="text-xs text-stone-500 mt-0.5">
                                                        {activity.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-stone-400 mt-1">
                                                    {formatTime(activity.timestamp)}
                                                </p>
                                            </div>
                                            {activity.amount && (
                                                <Badge variant="secondary" className="shrink-0">
                                                    {new Intl.NumberFormat('vi-VN', {
                                                        style: 'currency',
                                                        currency: 'VND',
                                                        notation: 'compact'
                                                    }).format(activity.amount)}
                                                </Badge>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
