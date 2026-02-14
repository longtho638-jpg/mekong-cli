"use client";

// ============================================================================
// WEATHER WIDGET - Sa Đéc Weather for Farmers
// ============================================================================
// Shows weather forecast to help farmers plan harvesting
// ============================================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Sun, Cloud, CloudRain, Wind, Droplets,
    Thermometer, AlertTriangle, ChevronRight
} from "lucide-react";

// Weather data type
interface WeatherData {
    temp: number;
    humidity: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    windSpeed: number;
    forecast: { day: string; temp: number; condition: string }[];
    recommendations: string[];
}

// Weather icons
const WEATHER_ICONS = {
    sunny: <Sun className="w-10 h-10 text-amber-400" />,
    cloudy: <Cloud className="w-10 h-10 text-stone-400" />,
    rainy: <CloudRain className="w-10 h-10 text-blue-400" />,
    stormy: <CloudRain className="w-10 h-10 text-purple-400" />
};

// Mock weather data (Sa Đéc typical weather)
function getMockWeather(): WeatherData {
    const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
        temp: 28 + Math.floor(Math.random() * 6),
        humidity: 70 + Math.floor(Math.random() * 20),
        condition,
        windSpeed: 5 + Math.floor(Math.random() * 10),
        forecast: [
            { day: 'Hôm nay', temp: 30, condition: '☀️' },
            { day: 'Mai', temp: 29, condition: '⛅' },
            { day: 'Kia', temp: 28, condition: '🌧️' },
            { day: 'Thứ 5', temp: 31, condition: '☀️' },
            { day: 'Thứ 6', temp: 30, condition: '⛅' },
        ],
        recommendations: condition === 'rainy'
            ? ['Che phủ hoa tránh mưa', 'Thoát nước vườn', 'Hoãn thu hoạch']
            : condition === 'sunny'
                ? ['Tưới sáng sớm', 'Che nắng trưa', 'Thu hoạch tốt']
                : ['Thời tiết ổn định', 'Có thể thu hoạch', 'Tưới tiêu bình thường']
    };
}

// Main widget component
export function WeatherWidget({ compact = false }: { compact?: boolean }) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setWeather(getMockWeather());
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return (
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 animate-pulse">
                <div className="h-20 bg-stone-800 rounded-lg" />
            </div>
        );
    }

    if (!weather) return null;

    if (compact) {
        return (
            <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3">
                {WEATHER_ICONS[weather.condition]}
                <div className="flex-1">
                    <div className="text-white font-bold">{weather.temp}°C</div>
                    <div className="text-blue-300 text-xs">Sa Đéc</div>
                </div>
                <div className="text-stone-400 text-xs">
                    💧 {weather.humidity}%
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/20 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-blue-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold">Thời tiết Sa Đéc</h3>
                        <p className="text-blue-300 text-sm">Cập nhật: vừa xong</p>
                    </div>
                    {WEATHER_ICONS[weather.condition]}
                </div>
            </div>

            {/* Current weather */}
            <div className="p-4">
                <div className="flex items-center gap-6 mb-4">
                    <div>
                        <div className="text-5xl font-bold text-white">{weather.temp}°</div>
                        <div className="text-blue-300 capitalize">{weather.condition}</div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="bg-stone-800/50 rounded-lg p-2 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-400" />
                            <div>
                                <div className="text-white text-sm">{weather.humidity}%</div>
                                <div className="text-stone-500 text-xs">Độ ẩm</div>
                            </div>
                        </div>
                        <div className="bg-stone-800/50 rounded-lg p-2 flex items-center gap-2">
                            <Wind className="w-4 h-4 text-cyan-400" />
                            <div>
                                <div className="text-white text-sm">{weather.windSpeed} km/h</div>
                                <div className="text-stone-500 text-xs">Gió</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5-day forecast */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {weather.forecast.map((day, i) => (
                        <div
                            key={i}
                            className={`
                shrink-0 text-center p-2 rounded-lg min-w-[60px]
                ${i === 0 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-stone-800/50'}
              `}
                        >
                            <div className="text-stone-400 text-xs mb-1">{day.day}</div>
                            <div className="text-xl mb-1">{day.condition}</div>
                            <div className="text-white text-sm font-medium">{day.temp}°</div>
                        </div>
                    ))}
                </div>

                {/* Recommendations */}
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Khuyến nghị cho nông dân
                    </div>
                    <ul className="space-y-1">
                        {weather.recommendations.map((rec, i) => (
                            <li key={i} className="text-stone-300 text-sm flex items-center gap-2">
                                <span className="text-amber-400">•</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Floating weather indicator
export function WeatherIndicator() {
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        setWeather(getMockWeather());
    }, []);

    if (!weather) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-4 right-4 z-40 bg-stone-900/90 backdrop-blur-sm border border-stone-700 rounded-full px-4 py-2 flex items-center gap-2"
        >
            {WEATHER_ICONS[weather.condition]}
            <span className="text-white font-bold">{weather.temp}°</span>
            <span className="text-stone-400 text-sm">Sa Đéc</span>
        </motion.div>
    );
}

export default WeatherWidget;
