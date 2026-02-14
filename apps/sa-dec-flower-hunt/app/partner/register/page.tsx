"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sprout, TrendingUp, Terminal, Truck, Wallet, Zap } from "lucide-react"
import Link from "next/link"

export default function PartnerOnboardingPage() {
    const [pots, setPots] = useState([500])
    const commissionRate = 0.85
    const avgPrice = 150000

    const potentialRevenue = pots[0] * avgPrice * commissionRate
    const formattedRevenue = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(potentialRevenue)

    const features = [
        {
            name: 'Farm_OS',
            description: 'Hệ thống quản lý vườn chuyên nghiệp. Theo dõi đơn hàng, doanh thu mọi lúc.',
            icon: Terminal,
        },
        {
            name: 'Đầu_Ra_Ổn_Định',
            description: 'Tiếp cận hàng nghìn khách hàng từ TP.HCM và các tỉnh lân cận.',
            icon: TrendingUp,
        },
        {
            name: 'Vận_Chuyển_Trọn_Gói',
            description: 'Đội ngũ shipper chuyên nghiệp sẽ đến tận vườn lấy hoa.',
            icon: Truck,
        },
        {
            name: 'Thanh_Toán_Nhanh',
            description: 'Nhận tiền ngay khi đơn hàng hoàn thành. Đối soát minh bạch.',
            icon: Wallet,
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white font-mono">
            {/* Background Image */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_farmer_hyperreal_1765367316910.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black pointer-events-none" />
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden py-20 sm:py-28">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.2),transparent_50%)]" />

                <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 mb-6 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full">
                            <Sprout className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-emerald-400 uppercase tracking-wider font-bold">
                                Dành cho Nhà Vườn Sa Đéc
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
                            <span className="text-white">Biến Vườn Hoa Thành</span><br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                                CỖ_MÁY_IN_TIỀN
                            </span>
                        </h1>

                        <p className="text-stone-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
                            Tham gia mạng lưới Dropshipping đầu tiên tại Sa Đéc.
                            Chúng tôi lo bán hàng & vận chuyển, bạn chỉ cần chăm sóc hoa.
                        </p>

                        <Link href="/partner/register/form">
                            <Button className="h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm uppercase tracking-wider rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all">
                                <Zap className="w-5 h-5 mr-2" />
                                Đăng Ký Ngay
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Earnings Calculator */}
            <div className="py-16 sm:py-24">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-12"
                    >
                        <div className="text-xs text-emerald-500 uppercase tracking-wider font-bold mb-2">
                            Thu Nhập Dự Kiến
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            Bạn có bao nhiêu chậu hoa?
                        </h2>
                        <p className="text-stone-500 text-sm mt-2">
                            Kéo thanh trượt để xem doanh thu tiềm năng mỗi vụ Tết.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="bg-stone-950 border border-emerald-500/30 rounded-lg p-8">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-stone-400 flex items-center gap-2">
                                            <Sprout className="w-4 h-4 text-emerald-500" />
                                            Số lượng chậu
                                        </span>
                                        <span className="text-2xl font-black text-white font-mono">
                                            {pots[0].toLocaleString()}
                                        </span>
                                    </div>
                                    <Slider
                                        value={pots}
                                        onValueChange={setPots}
                                        max={5000}
                                        step={50}
                                        className="py-4"
                                    />
                                    <div className="flex justify-between text-[10px] text-stone-600 uppercase tracking-wider">
                                        <span>50 chậu</span>
                                        <span>5,000 chậu</span>
                                    </div>
                                </div>

                                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-6 text-center">
                                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">
                                        Doanh thu dự kiến (Sau chiết khấu)
                                    </p>
                                    <motion.div
                                        key={potentialRevenue}
                                        initial={{ scale: 0.9, opacity: 0.5 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono"
                                    >
                                        {formattedRevenue}
                                    </motion.div>
                                    <p className="text-[10px] text-stone-600 mt-3 flex items-center justify-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Dựa trên giá trung bình 150k/chậu & hoa hồng 15%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-16 sm:py-24 border-t border-emerald-500/10">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="text-xs text-emerald-500 uppercase tracking-wider font-bold mb-2">
                            Tại sao chọn chúng tôi?
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            Hệ sinh thái Nông nghiệp #1 Sa Đéc
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="bg-stone-950 border border-emerald-500/20 rounded-lg p-6 hover:border-emerald-500/40 transition-colors"
                            >
                                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                                    {feature.name}
                                </h3>
                                <p className="text-xs text-stone-500">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="py-16 border-t border-emerald-500/10">
                <div className="mx-auto max-w-xl px-6 text-center">
                    <Link href="/partner/register/form">
                        <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm uppercase tracking-wider rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                            Bắt Đầu Đăng Ký →
                        </Button>
                    </Link>
                    <p className="text-[10px] text-stone-600 mt-4 uppercase tracking-wider">
                        Miễn phí đăng ký • Không ràng buộc
                    </p>
                </div>
            </div>
        </div>
    )
}
