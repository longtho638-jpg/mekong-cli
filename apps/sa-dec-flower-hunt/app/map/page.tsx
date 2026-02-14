"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Navigation, Search, Filter } from 'lucide-react';
import { SimpleGardenMap } from '@/components/map/SimpleGardenMap';

interface Garden {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    photos: string[];
    open_hours: string;
    visit_price: number;
    specialties: string[];
    verified: boolean;
    farmer_name?: string;
}

interface Landmark {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    category: string;
    photos: string[];
}

export default function GardenMapPage() {
    const [gardens, setGardens] = useState<Garden[]>([]);
    const [landmarks, setLandmarks] = useState<Landmark[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await fetch('/api/map/locations');
            const data = await response.json();
            setGardens(data.gardens || []);
            setLandmarks(data.landmarks || []);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <MapIcon className="w-16 h-16 text-emerald-500 animate-pulse mx-auto mb-4" />
                    <p className="text-stone-400">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <MapIcon className="w-10 h-10 text-emerald-500" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Explore Sa Dec Gardens
                        </h1>
                    </div>
                    <p className="text-stone-500">
                        Discover flower gardens, landmarks, and hidden gems in Sa Dec City
                    </p>
                </motion.div>

                {/* Stats Bar */}
                <motion.div
                    className="bg-stone-950 border border-stone-800 rounded-sm p-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-sm text-stone-500 mb-1">Flower Gardens</div>
                            <div className="text-3xl font-bold text-emerald-500">
                                {gardens.length}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-stone-500 mb-1">Landmarks</div>
                            <div className="text-3xl font-bold text-purple-500">
                                {landmarks.length}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-stone-500 mb-1">Verified</div>
                            <div className="text-3xl font-bold text-cyan-500">
                                {gardens.filter(g => g.verified).length}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-stone-500 mb-1">Free Entry</div>
                            <div className="text-3xl font-bold text-amber-500">
                                {gardens.filter(g => g.visit_price === 0).length}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <SimpleGardenMap gardens={gardens} landmarks={landmarks} />
                </motion.div>

                {/* Quick Guide */}
                <motion.div
                    className="bg-stone-950 border border-stone-800 rounded-sm p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-xl font-bold text-white mb-4">How to Use</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                <Search className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="font-bold text-white mb-1">Explore</div>
                                <div className="text-sm text-stone-500">
                                    Click on garden markers to see details, photos, and opening hours
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center shrink-0">
                                <Navigation className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <div className="font-bold text-white mb-1">Navigate</div>
                                <div className="text-sm text-stone-500">
                                    Click "Navigate" to get directions from your current location
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                                <MapIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <div className="font-bold text-white mb-1">Visit</div>
                                <div className="text-sm text-stone-500">
                                    Check-in at landmarks to collect badges and earn rewards!
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* No Data Message */}
                {gardens.length === 0 && landmarks.length === 0 && (
                    <div className="bg-stone-950 border border-stone-800 rounded-sm p-12 text-center">
                        <MapIcon className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            Map Coming Soon!
                        </h3>
                        <p className="text-stone-500">
                            We're adding gardens and landmarks to the map. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
