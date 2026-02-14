"use client";

import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";

export default function GamificationPage() {
    // For demo, use test farmer ID
    const testFarmerId = "00000000-0000-0000-0000-000000000001";

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        Farmer Achievements
                    </h1>
                    <p className="text-stone-500">Level up your business, unlock rewards!</p>
                </div>

                <GamificationDashboard farmerId={testFarmerId} />
            </div>
        </div>
    );
}
