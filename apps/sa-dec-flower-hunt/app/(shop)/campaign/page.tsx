"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Camera, Share2, Sparkles, Sprout } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CampaignPage() {
    return (
        <div className="min-h-screen bg-stone-900 text-white pb-24">
            {/* Hero Section */}
            <div className="relative h-[60vh] overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=1200"
                    alt="Sa Dec Flower Festival"
                    fill
                    className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent flex items-end p-6">
                    <div>
                        <Badge className="bg-green-500 hover:bg-green-600 mb-4 text-lg px-4 py-1">Đang diễn ra</Badge>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                            #SaDec<span className="text-yellow-400">Flower</span>Challenge
                        </h1>
                        <p className="text-stone-300 text-lg md:text-xl max-w-xl">
                            Săn hoa, khoe ảnh, rinh iPhone 15 & trở thành Đại Sứ Làng Hoa 2026.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mechanics */}
            <div className="max-w-md mx-auto px-6 -mt-10 relative z-10 space-y-6">

                {/* Step 1 */}
                <Card className="bg-stone-800/80 border-stone-700 backdrop-blur-md">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="bg-yellow-500/20 p-3 rounded-full">
                            <Camera className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl mb-1">1. Check-in Vườn Hoa</h3>
                            <p className="text-stone-400 text-sm">Chụp ảnh check-in tại bất kỳ điểm nào trong Làng Hoa Sa Đéc.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2 */}
                <Card className="bg-stone-800/80 border-stone-700 backdrop-blur-md">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-full">
                            <Share2 className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl mb-1">2. Đăng TikTok/FaceBook</h3>
                            <p className="text-stone-400 text-sm">Hashtag <b>#SaDecFlowerHunt</b>. Clip càng sáng tạo, điểm càng cao!</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 3 */}
                <Card className="bg-stone-800/80 border-stone-700 backdrop-blur-md">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="bg-purple-500/20 p-3 rounded-full">
                            <Sprout className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl mb-1">3. Trồng Cây Ảo</h3>
                            <p className="text-stone-400 text-sm">Mỗi bài đăng = 1 cây xanh được trồng tại rừng phòng hộ nhờ trích quỹ Sa Đéc.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Rewards */}
                <div className="pt-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                        <Trophy className="text-yellow-400" /> Giải Thưởng
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-stone-800 p-4 rounded-xl text-center border border-yellow-500/30">
                            <div className="text-3xl mb-2">📱</div>
                            <div className="font-bold text-yellow-400">iPhone 15</div>
                            <div className="text-xs text-stone-500">Giải Đặc Biệt</div>
                        </div>
                        <div className="bg-stone-800 p-4 rounded-xl text-center border border-white/10">
                            <div className="text-3xl mb-2">🎟️</div>
                            <div className="font-bold">Voucher 5Tr</div>
                            <div className="text-xs text-stone-500">Giải Tuần</div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="fixed bottom-6 left-6 right-6 z-50">
                    <Link href="/scan">
                        <Button size="lg" className="w-full bg-yellow-400 text-stone-900 font-bold hover:bg-yellow-500 h-14 text-lg shadow-xl shadow-yellow-900/20">
                            <Sparkles className="w-5 h-5 mr-2" /> Tham Gia Ngay
                        </Button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
