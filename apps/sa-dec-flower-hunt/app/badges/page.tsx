"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Award, MapPin } from 'lucide-react';
import { CheckInScanner, BadgeCollection } from '@/components/checkin/CheckInScanner';

export default function CheckInPage() {
    const [badges, setBadges] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [stats, setStats] = useState({ total_check_ins: 0, tourist_points: 0 });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        // Demo data - in production, fetch from API based on logged-in user
        const demoUser = '00000000-0000-0000-0000-000000000001';

        try {
            // This would be a real API call in production
            setBadges([]);
            setCheckIns([]);
            setStats({ total_check_ins: 0, tourist_points: 0 });
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    };

    const handleCheckIn = () => {
        // Refresh data after check-in
        fetchUserData();
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <QrCode className="w-10 h-10 text-purple-500" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Check-In & Collect Badges
                        </h1>
                    </div>
                    <p className="text-stone-500">
                        Visit landmarks, scan QR codes, and unlock achievements!
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    className="bg-stone-950 border border-stone-800 rounded-sm p-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-stone-500 mb-1">Total Check-Ins</div>
                            <div className="text-3xl font-bold text-purple-500">
                                {stats.total_check_ins}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-stone-500 mb-1">Tourist Points</div>
                            <div className="text-3xl font-bold text-amber-500">
                                {stats.tourist_points}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-stone-500 mb-1">Badges Earned</div>
                            <div className="text-3xl font-bold text-cyan-500">
                                {badges.length}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Scanner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <CheckInScanner onCheckIn={handleCheckIn} />
                </motion.div>

                {/* Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <BadgeCollection badges={badges} />
                </motion.div>

                {/* How It Works */}
                <motion.div
                    className="bg-stone-950 border border-stone-800 rounded-sm p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-500" />
                        How to Check-In
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 font-bold text-purple-400">
                                1
                            </div>
                            <div>
                                <div className="font-bold text-white">Visit a Landmark</div>
                                <div className="text-sm text-stone-500">
                                    Go to Sa Dec Flower Market, Ancient House, or any marked location
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 font-bold text-purple-400">
                                2
                            </div>
                            <div>
                                <div className="font-bold text-white">Scan the QR Code</div>
                                <div className="text-sm text-stone-500">
                                    Find the official check-in QR code at the location
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 font-bold text-purple-400">
                                3
                            </div>
                            <div>
                                <div className="font-bold text-white">Earn Points & Badges</div>
                                <div className="text-sm text-stone-500">
                                    Collect badges and unlock rewards as you explore Sa Dec!
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Badge Milestones */}
                <div className="bg-stone-950 border border-amber-500/30 rounded-sm p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Badge Milestones</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-stone-900/30 rounded">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🧭</span>
                                <div>
                                    <div className="font-bold text-white">Explorer</div>
                                    <div className="text-xs text-stone-500">First check-in</div>
                                </div>
                            </div>
                            <div className="text-xs text-stone-600">1 location</div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-stone-900/30 rounded">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🗺️</span>
                                <div>
                                    <div className="font-bold text-white">Adventurer</div>
                                    <div className="text-xs text-stone-500">Visit 5 locations</div>
                                </div>
                            </div>
                            <div className="text-xs text-stone-600">5 locations</div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-stone-900/30 rounded">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <div className="font-bold text-white">Sa Dec Legend</div>
                                    <div className="text-xs text-stone-500">Explore all major landmarks</div>
                                </div>
                            </div>
                            <div className="text-xs text-stone-600">10 locations</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
