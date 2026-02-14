"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Scanner } from '@yudiel/react-qr-scanner';
import confetti from 'canvas-confetti';
import { motion } from "framer-motion";
import { ScanLine, Zap, Trophy, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Generate flower names based on QR code
const FLOWER_NAMES = [
    "Hoa Hồng Sa Đéc",
    "Hoa Cúc Vàng",
    "Hoa Mai Tết",
    "Hoa Đào Bắc",
    "Hoa Lan Hồ Điệp",
    "Hoa Vạn Thọ",
    "Hoa Cẩm Chướng",
    "Hoa Tulip Hà Lan",
    "Hoa Ly Trắng",
    "Hoa Sen Hồng"
];

export default function QRScanner() {
    const [scanned, setScanned] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [currentRank, setCurrentRank] = useState<number | null>(null);
    const [flowerName, setFlowerName] = useState("");
    const router = useRouter();

    // Sound effect
    const playSuccessSound = () => {
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(e => console.log("Audio play failed", e));
    };

    // Add points to leaderboard
    const addPointsToLeaderboard = async (points: number, flower: string) => {
        if (!supabase) {
            console.warn("Supabase not initialized");
            return { totalPoints: points, rank: null };
        }

        try {
            // Get current user (or use anonymous session)
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || `anon_${Date.now()}`;
            const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Khách";

            // Check if user exists in leaderboard
            const { data: existing } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('user_id', userId)
                .single();

            let newTotalPoints = points;
            let newFlowersScanned = 1;

            if (existing) {
                // Update existing entry
                newTotalPoints = (existing.points || 0) + points;
                newFlowersScanned = (existing.flowers_scanned || 0) + 1;

                await supabase
                    .from('leaderboard')
                    .update({
                        points: newTotalPoints,
                        flowers_scanned: newFlowersScanned,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);
            } else {
                // Insert new entry
                await supabase
                    .from('leaderboard')
                    .insert({
                        user_id: userId,
                        name: userName,
                        points: points,
                        flowers_scanned: 1,
                        avatar_url: user?.user_metadata?.avatar_url || null
                    });
            }

            // Get current rank
            const { data: rankings } = await supabase
                .from('leaderboard')
                .select('user_id, points')
                .order('points', { ascending: false });

            let rank = null;
            if (rankings) {
                const userIndex = rankings.findIndex(r => r.user_id === userId);
                if (userIndex !== -1) rank = userIndex + 1;
            }

            return { totalPoints: newTotalPoints, rank };
        } catch (error) {
            console.error("Leaderboard error:", error);
            return { totalPoints: points, rank: null };
        }
    };

    const handleScan = async (text: string) => {
        if (scanned || !text) return;

        setScanned(true);
        setScanResult(text);

        // 1. Haptic Feedback
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        // 2. Confetti WOW
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#22c55e', '#eab308']
        });

        // 3. Calculate points & flower (based on QR content)
        const points = 100 + Math.floor(Math.random() * 400); // 100-500 points
        const flower = FLOWER_NAMES[Math.floor(Math.random() * FLOWER_NAMES.length)];
        setPointsEarned(points);
        setFlowerName(flower);

        // 4. Add to leaderboard
        const { totalPoints: newTotal, rank } = await addPointsToLeaderboard(points, flower);
        setTotalPoints(newTotal);
        setCurrentRank(rank);

        // 5. Success toast
        toast.success(`🎯 +${points} ĐIỂM!`, {
            description: `Bạn tìm thấy "${flower}"`,
            duration: 4000,
            style: {
                background: '#10b981',
                color: 'white',
                border: 'none',
                fontWeight: 'bold'
            },
            icon: <Zap className="w-5 h-5 text-yellow-300" />
        });

        // 6. Auto-reset after delay (allow user to continue)
        setTimeout(() => {
            setScanned(false);
            setScanResult(null);
        }, 5000);
    };

    const handleError = (error: unknown) => {
        console.error("QR Error:", error);
        // Only show toast if it's a permission error
        // toast.error("Không thể mở camera. Hãy cấp quyền!");
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black z-0"></div>

            {/* Header */}
            <div className="relative z-10 mb-8 text-center">
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <ScanLine className="w-6 h-6 text-red-500 animate-pulse" />
                    Máy Quét AR
                </h1>
                <p className="text-white/60 text-sm">Tìm mã QR trên các chậu hoa để săn quà</p>
            </div>

            {/* Scanner Container */}
            <div className="w-full max-w-sm aspect-[3/4] bg-stone-900 rounded-3xl overflow-hidden relative border border-stone-800 shadow-2xl z-10">

                {/* Real Camera Scanner */}
                <div className="absolute inset-0 w-full h-full">
                    <Scanner
                        onScan={(result) => {
                            if (result && result.length > 0) {
                                handleScan(result[0].rawValue);
                            }
                        }}
                        onError={handleError}
                        components={{
                            // Hide default UI elements if desired, or keep them
                        }}
                        styles={{
                            container: {
                                width: '100%',
                                height: '100%'
                            },
                            video: {
                                objectFit: 'cover',
                                width: '100%',
                                height: '100%'
                            }
                        }}
                        allowMultiple={true}
                        scanDelay={2000} // Prevent rapid fire
                    />
                </div>

                {/* Overlay UI - The "WOW" Frame */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Darken corners for focus */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_50%,_rgba(0,0,0,0.8)_100%)]"></div>

                    {/* Animated Scanning Line */}
                    {!scanned && (
                        <motion.div
                            animate={{ top: ['5%', '95%', '5%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-20"
                        />
                    )}

                    {/* Corner Reticles */}
                    <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-2xl"></div>
                    <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-2xl"></div>
                    <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-2xl"></div>
                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-2xl"></div>

                    {/* Center Focus (Optional) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className="w-48 h-48 border border-white/30 rounded-lg"></div>
                    </div>
                </div>

                {/* Scanned Success Overlay */}
                {scanned && (
                    <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-emerald-600 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in p-4">
                        <div className="bg-white p-6 rounded-full shadow-xl mb-4">
                            <Zap className="w-12 h-12 text-green-600 fill-green-600" />
                        </div>
                        <h3 className="text-white text-3xl font-bold">+{pointsEarned} ĐIỂM!</h3>
                        <p className="text-white/90 font-medium mt-2">{flowerName}</p>

                        {currentRank && (
                            <div className="mt-4 bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-300" />
                                <span className="text-white font-bold">Xếp hạng #{currentRank}</span>
                            </div>
                        )}

                        <Link
                            href="/leaderboard"
                            className="mt-6 bg-white text-green-700 font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                            <Trophy className="w-5 h-5" />
                            Xem Bảng Xếp Hạng
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Helper Text */}
            <div className="mt-8 text-center text-stone-500 max-w-xs text-sm z-10">
                <p className="mb-4">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Camera đang hoạt động
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 rounded-full border border-stone-700 text-stone-400 hover:bg-stone-900 transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
}
