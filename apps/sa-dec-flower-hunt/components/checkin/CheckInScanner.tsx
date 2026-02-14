"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Camera, MapPin, Award, Sparkles, CheckCircle } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface CheckInProps {
    onCheckIn?: (landmarkId: string, photo?: File) => void;
}

export function CheckInScanner({ onCheckIn }: CheckInProps) {
    const [scanning, setScanning] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [newBadge, setNewBadge] = useState<string | null>(null);
    const { width, height } = useWindowSize();

    const handleScan = async () => {
        if (!qrCode.trim()) {
            alert('Please enter or scan a QR code');
            return;
        }

        try {
            const response = await fetch('/api/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    qr_code: qrCode
                })
            });

            const data = await response.json();

            if (data.success) {
                // Show success animation
                if (data.badge_earned) {
                    setNewBadge(data.badge_earned);
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 5000);
                }

                // Clear input
                setQrCode('');

                // Notify parent
                onCheckIn?.(data.landmark_id);

                alert(`✅ Checked in at ${data.landmark_name}!\n+${data.points} points`);
            } else {
                alert(data.message || 'Check-in failed');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            alert('Failed to check in. Please try again.');
        }
    };

    return (
        <div className="bg-stone-950 border border-stone-800 rounded-sm p-6">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Check-In Scanner</h3>
                    <p className="text-sm text-stone-500">Scan QR at landmarks to collect badges</p>
                </div>
            </div>

            {/* QR Input */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-stone-400 mb-2">
                        QR Code
                    </label>
                    <input
                        type="text"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        placeholder="Scan or enter QR code"
                        className="w-full bg-stone-900 border border-stone-800 rounded px-4 py-3 text-white placeholder-stone-600 focus:border-purple-500 focus:outline-none"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleScan}
                        disabled={!qrCode.trim()}
                        className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-stone-800 disabled:text-stone-600 text-white font-bold rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Check In
                    </button>

                    <button
                        onClick={() => setScanning(!scanning)}
                        className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded transition-colors flex items-center gap-2"
                    >
                        <Camera className="w-5 h-5" />
                        {scanning ? 'Stop' : 'Scan'}
                    </button>
                </div>
            </div>

            {/* Demo QR Codes */}
            <div className="mt-6 bg-stone-900/50 border border-stone-800 rounded p-4">
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-3">
                    Demo QR Codes (for testing)
                </div>
                <div className="flex flex-wrap gap-2">
                    {['LANDMARK_MARKET', 'LANDMARK_ANCIENT_HOUSE', 'LANDMARK_TEMPLE'].map((code) => (
                        <button
                            key={code}
                            onClick={() => setQrCode(code)}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs text-purple-400 rounded transition-colors"
                        >
                            {code.replace('LANDMARK_', '')}
                        </button>
                    ))}
                </div>
            </div>

            {/* New Badge Animation */}
            <AnimatePresence>
                {newBadge && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setNewBadge(null)}
                    >
                        <motion.div
                            className="bg-stone-950 border-2 border-amber-500 rounded-sm p-8 text-center max-w-sm"
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                        >
                            <Sparkles className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Badge Unlocked!
                            </h3>
                            <p className="text-lg text-amber-400 font-bold mb-4">
                                {newBadge}
                            </p>
                            <button
                                onClick={() => setNewBadge(null)}
                                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded"
                            >
                                Awesome!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Badge Display Component
export function BadgeCollection({ badges }: { badges: any[] }) {
    const BADGE_ICONS: Record<string, string> = {
        explorer: '🧭',
        adventurer: '🗺️',
        legend: '🏆',
        festival_goer: '🎊'
    };

    return (
        <div className="bg-stone-950 border border-stone-800 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-bold text-white">Your Badges</h3>
            </div>

            {badges.length === 0 ? (
                <div className="text-center py-8 text-stone-600">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Check in at landmarks to collect badges!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={badge.id}
                            className="bg-stone-900/50 border border-amber-500/30 rounded p-4 text-center"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="text-4xl mb-2">
                                {BADGE_ICONS[badge.badge_type] || '🏅'}
                            </div>
                            <div className="text-sm font-bold text-white mb-1">
                                {badge.badge_name}
                            </div>
                            <div className="text-xs text-stone-500">
                                {new Date(badge.earned_at).toLocaleDateString()}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
