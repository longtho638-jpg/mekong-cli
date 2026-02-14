"use client";

import { useState } from "react";
import { Copy, Gift, Users, Share2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ReferralDashboard() {
    const [referralCode, setReferralCode] = useState("SADEC-TET26");
    const [copied, setCopied] = useState(false);

    // Mock data for WOW effect (Real implementation will fetch from DB)
    const stats = {
        friendsInvited: 0,
        creditsEarned: 0
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://sa-dec-flower-hunt.vercel.app?ref=${referralCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Sa Đéc Flower Hunt - Săn Hoa Tết',
                    text: 'Nhận ngay 30k khi mua hoa Sa Đéc chính gốc!',
                    url: `https://sa-dec-flower-hunt.vercel.app?ref=${referralCode}`
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-400 to-red-500 p-8 text-center text-white">
                <Gift className="w-12 h-12 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold mb-2">Mời Bạn Bè - Nhận Quà Kép</h2>
                <p className="opacity-90">Bạn nhận 30.000đ • Bạn bè nhận 30.000đ</p>
            </div>

            <div className="p-6 space-y-8">
                {/* Code Section */}
                <div className="text-center">
                    <p className="text-sm text-stone-500 mb-2">Mã giới thiệu của bạn</p>
                    <div className="bg-stone-100 rounded-xl p-4 flex items-center justify-between gap-4 max-w-sm mx-auto border border-stone-200 border-dashed">
                        <span className="font-mono font-bold text-xl text-stone-800 tracking-wider">
                            {referralCode}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className={copied ? "text-green-600" : "text-stone-500 hover:text-stone-800"}
                        >
                            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </Button>
                    </div>
                    <Button
                        onClick={handleShare}
                        className="mt-6 w-full max-w-sm bg-stone-900 text-white rounded-xl h-12 font-bold hover:bg-stone-800 shadow-lg"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Chia Sẻ Ngay
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-50 p-4 rounded-2xl text-center border border-stone-100">
                        <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold text-stone-900">{stats.friendsInvited}</div>
                        <div className="text-xs text-stone-500">Bạn bè đã mời</div>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl text-center border border-stone-100">
                        <div className="font-bold text-green-600 text-xl mb-2">0đ</div>
                        <div className="text-xs text-stone-500">Tiền thưởng (Sắp ra mắt)</div>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                    <h3 className="font-bold text-stone-800 text-center">Cách thức hoạt động</h3>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                        <p className="text-sm text-stone-600">Gửi mã giới thiệu hoặc đường link cho bạn bè.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                        <p className="text-sm text-stone-600">Bạn bè đặt đơn hàng đầu tiên thành công.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        <p className="text-sm text-stone-600">Cả 2 nhận ngay voucher 30.000đ cho lần mua tiếp theo.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
