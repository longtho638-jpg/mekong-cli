"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

interface LiveMetricCardProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    format?: 'number' | 'currency' | 'percentage';
    trend?: number; // percentage change
    subtitle?: string;
    refreshInterval?: number; // ms
}

export function LiveMetricCard({
    title,
    value,
    icon: Icon,
    format = 'number',
    trend,
    subtitle,
    refreshInterval = 30000
}: LiveMetricCardProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Animated counter effect
    useEffect(() => {
        if (typeof value === 'number' && typeof displayValue === 'number') {
            const diff = value - displayValue;
            const step = diff / 20; // 20 frames
            const interval = setInterval(() => {
                setDisplayValue(prev => {
                    if (typeof prev === 'number') {
                        const next = prev + step;
                        if (Math.abs(value - next) < Math.abs(step)) {
                            clearInterval(interval);
                            return value;
                        }
                        return next;
                    }
                    return value;
                });
            }, 30);
            return () => clearInterval(interval);
        } else {
            setDisplayValue(value);
        }
    }, [value]);

    // Format display
    const formattedValue = typeof displayValue === 'number'
        ? format === 'currency'
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(displayValue)
            : format === 'percentage'
                ? `${displayValue.toFixed(1)}%`
                : displayValue.toLocaleString()
        : displayValue;

    // Trend indicator
    const trendIcon = trend !== undefined
        ? trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
        : null;

    const trendColor = trend !== undefined
        ? trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="relative overflow-hidden border-stone-200 hover:shadow-lg transition-shadow">
                {isRefreshing && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
                )}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-stone-600">
                        {title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-stone-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-stone-900">
                        {formattedValue}
                    </div>
                    {(subtitle || trend !== undefined) && (
                        <div className="flex items-center gap-2 mt-2">
                            {trend !== undefined && trendIcon && (
                                <span className={`flex items-center text-xs ${trendColor}`}>
                                    {React.createElement(trendIcon, { className: "w-3 h-3 mr-1" })}
                                    {Math.abs(trend!).toFixed(1)}%
                                </span>
                            )}
                            {subtitle && (
                                <p className="text-xs text-stone-500">{subtitle}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
