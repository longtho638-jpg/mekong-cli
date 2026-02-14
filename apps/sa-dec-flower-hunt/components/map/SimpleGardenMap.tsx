"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Star, DollarSign, Clock, ExternalLink } from 'lucide-react';

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

interface SimpleGardenMapProps {
    gardens: Garden[];
    landmarks: Landmark[];
}

const GARDEN_ICONS: Record<string, string> = {
    rose: '🌹',
    lily: '🌸',
    orchid: '🌺',
    sunflower: '🌻',
    mixed: '💐'
};

const LANDMARK_ICONS: Record<string, string> = {
    market: '🏪',
    temple: '⛩️',
    monument: '🏛️',
    attraction: '📍'
};

export function SimpleGardenMap({ gardens, landmarks }: SimpleGardenMapProps) {
    const [selectedItem, setSelectedItem] = useState<Garden | Landmark | null>(null);

    const openInGoogleMaps = (lat: number, lng: number) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Map Placeholder with Action */}
            <div className="bg-stone-950 border-2 border-stone-800 rounded-sm p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Interactive Map Coming Soon!</h3>
                <p className="text-stone-500 mb-4">
                    Browse gardens and landmarks below, or open in Google Maps
                </p>
                <a
                    href="https://www.google.com/maps/search/flower+garden+sa+dec+vietnam/@10.298774,105.756188,14z"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded transition-colors"
                >
                    <ExternalLink className="w-5 h-5" />
                    Open Google Maps
                </a>
            </div>

            {/* Gardens Grid */}
            {gardens.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🌹</span>
                        Flower Gardens ({gardens.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gardens.map((garden) => {
                            const specialty = garden.specialties?.[0] || 'mixed';
                            const icon = GARDEN_ICONS[specialty] || '💐';

                            return (
                                <motion.div
                                    key={garden.id}
                                    className="bg-stone-950 border border-stone-800 rounded-sm p-4 hover:border-emerald-500/50 transition-colors cursor-pointer"
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setSelectedItem(garden)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-2xl">{icon}</span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-white truncate">{garden.name}</h4>
                                                {garden.verified && (
                                                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded shrink-0">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-stone-500 line-clamp-2 mb-2">
                                                {garden.description || garden.address}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-stone-600">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {garden.open_hours}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    {garden.visit_price === 0 ? 'Free' : `${(garden.visit_price / 1000).toFixed(0)}K`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Navigate Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openInGoogleMaps(garden.latitude, garden.longitude);
                                            }}
                                            className="px-3 py-2 bg-emerald-500/20 hover:bg-emirald-500/30 text-emerald-400 text-xs font-bold rounded transition-colors shrink-0"
                                        >
                                            <Navigation className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Landmarks Grid */}
            {landmarks.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🏛️</span>
                        Tourist Landmarks ({landmarks.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {landmarks.map((landmark) => {
                            const icon = LANDMARK_ICONS[landmark.category] || '📍';

                            return (
                                <motion.div
                                    key={landmark.id}
                                    className="bg-stone-950 border border-stone-800 rounded-sm p-4 hover:border-purple-500/50 transition-colors cursor-pointer"
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setSelectedItem(landmark)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-2xl">{icon}</span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-white mb-1">{landmark.name}</h4>
                                            <p className="text-xs text-stone-500 line-clamp-2">
                                                {landmark.description}
                                            </p>
                                        </div>

                                        {/* Navigate Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openInGoogleMaps(landmark.latitude, landmark.longitude);
                                            }}
                                            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-bold rounded transition-colors shrink-0"
                                        >
                                            <Navigation className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {gardens.length === 0 && landmarks.length === 0 && (
                <div className="bg-stone-950 border border-stone-800 rounded-sm p-12 text-center">
                    <MapPin className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        No Locations Yet
                    </h3>
                    <p className="text-stone-500">
                        Gardens and landmarks will appear here once added to the database
                    </p>
                </div>
            )}
        </div>
    );
}
