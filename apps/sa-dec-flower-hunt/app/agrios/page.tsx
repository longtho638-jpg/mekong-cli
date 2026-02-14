"use client";

// ============================================================================
// AGRIOS.TECH - Platform Vision Landing Page
// ============================================================================
// The future of agricultural technology - powered by AI, IoT, and blockchain
// ============================================================================

import { motion } from "framer-motion";
import {
    Cpu, Globe, Database, Shield, Zap, Users, TrendingUp,
    Leaf, Truck, Building2, Smartphone, Cloud, BarChart3,
    ChevronRight, Play, ArrowRight, Star, Check
} from "lucide-react";
import Link from "next/link";

// Feature card
function FeatureCard({ icon, title, description, gradient }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
}) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all group"
        >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-stone-400 text-sm">{description}</p>
        </motion.div>
    );
}

// Stat card
function StatCard({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) {
    return (
        <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                {value}{suffix}
            </div>
            <div className="text-stone-400 text-sm mt-1">{label}</div>
        </div>
    );
}

// Tech stack item
function TechItem({ name, icon }: { name: string; icon: React.ReactNode }) {
    return (
        <div className="bg-stone-800/50 border border-stone-700 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-stone-800 transition-colors">
            <div className="text-emerald-400">{icon}</div>
            <span className="text-stone-300 text-sm font-medium">{name}</span>
        </div>
    );
}

export default function AgriosPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Animated grid background */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }} />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-emerald-500/50 rounded-full"
                            initial={{
                                x: `${Math.random() * 100}%`,
                                y: `${Math.random() * 100}%`,
                                scale: Math.random() * 0.5 + 0.5
                            }}
                            animate={{
                                y: [null, `${Math.random() * 100}%`],
                                opacity: [0.3, 0.7, 0.3],
                            }}
                            transition={{
                                duration: 10 + Math.random() * 10,
                                repeat: Infinity,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-32">
                    {/* Badge */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
                            <Star className="w-4 h-4 fill-emerald-400" />
                            Agriculture 4.0 Platform
                            <Star className="w-4 h-4 fill-emerald-400" />
                        </div>
                    </motion.div>

                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center mb-6"
                    >
                        <h1 className="text-6xl md:text-8xl font-black">
                            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent">
                                AGRIOS
                            </span>
                            <span className="text-white">.tech</span>
                        </h1>
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-2xl text-stone-400 text-center max-w-3xl mx-auto mb-8"
                    >
                        <span className="text-white">Agriculture + Operating System</span>
                        <br />
                        Nền tảng công nghệ nông nghiệp thông minh đầu tiên tại Việt Nam
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <Link
                            href="/register"
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
                        >
                            Bắt đầu miễn phí <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/video"
                            className="bg-stone-800 hover:bg-stone-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 border border-stone-700 transition-all"
                        >
                            <Play className="w-5 h-5" /> Xem Demo
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 p-8 bg-stone-900/50 rounded-2xl border border-stone-800"
                    >
                        <StatCard value="500" suffix="+" label="Nhà vườn đăng ký" />
                        <StatCard value="10K" suffix="+" label="Sản phẩm" />
                        <StatCard value="50K" suffix="+" label="Khách hàng" />
                        <StatCard value="99.9" suffix="%" label="Uptime" />
                    </motion.div>
                </div>
            </section>

            {/* Platform Ecosystem */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Hệ sinh thái <span className="text-emerald-400">5 Trụ Cột</span>
                        </h2>
                        <p className="text-stone-400 max-w-2xl mx-auto">
                            Kết nối tọ bộ chuỗi giá trị nông nghiệp - từ vườn đến bàn ăn
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<Leaf className="w-6 h-6 text-white" />}
                            title="🌸 Farmer OS"
                            description="Dashboard quản lý vườn, AI Vision đếm hoa, dự báo năng suất, kết nối thị trường"
                            gradient="from-emerald-500 to-green-600"
                        />
                        <FeatureCard
                            icon={<Smartphone className="w-6 h-6 text-white" />}
                            title="🎯 Hunter Guide"
                            description="App du khách, bản đồ AR, săn loot box, QR codes, đặt hoa trực tiếp từ vườn"
                            gradient="from-amber-500 to-orange-600"
                        />
                        <FeatureCard
                            icon={<Building2 className="w-6 h-6 text-white" />}
                            title="🏦 Fintech Module"
                            description="Tín dụng vi mô cho nông dân, ví điện tử, thanh toán không tiền mặt, credit scoring"
                            gradient="from-blue-500 to-indigo-600"
                        />
                        <FeatureCard
                            icon={<Truck className="w-6 h-6 text-white" />}
                            title="🚚 Cold Chain"
                            description="Logistics lạnh IoT, theo dõi nhiệt độ realtime, giao hàng 24h toàn quốc"
                            gradient="from-cyan-500 to-blue-600"
                        />
                        <FeatureCard
                            icon={<Database className="w-6 h-6 text-white" />}
                            title="📊 Supply Chain"
                            description="Truy xuất nguồn gốc blockchain, QR từ vườn đến khách, minh bạch 100%"
                            gradient="from-purple-500 to-pink-600"
                        />
                        <FeatureCard
                            icon={<Cpu className="w-6 h-6 text-white" />}
                            title="🤖 AI Agents"
                            description="24 AI agents tự động: SEO, TikTok viral, email nurture, customer support"
                            gradient="from-rose-500 to-red-600"
                        />
                    </div>
                </div>
            </section>

            {/* Technology Stack */}
            <section className="py-20 px-4 bg-stone-900/50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Công nghệ <span className="text-emerald-400">Tiên Tiến</span>
                        </h2>
                        <p className="text-stone-400 max-w-2xl mx-auto">
                            Được xây dựng trên nền tảng công nghệ hiện đại nhất
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TechItem name="Next.js 14" icon={<Globe className="w-5 h-5" />} />
                        <TechItem name="Supabase" icon={<Database className="w-5 h-5" />} />
                        <TechItem name="Vercel Edge" icon={<Cloud className="w-5 h-5" />} />
                        <TechItem name="PostgreSQL" icon={<Database className="w-5 h-5" />} />
                        <TechItem name="Realtime WS" icon={<Zap className="w-5 h-5" />} />
                        <TechItem name="AI/ML" icon={<Cpu className="w-5 h-5" />} />
                        <TechItem name="IoT Sensors" icon={<Smartphone className="w-5 h-5" />} />
                        <TechItem name="Blockchain" icon={<Shield className="w-5 h-5" />} />
                    </div>
                </div>
            </section>

            {/* Why Agrios */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ x: -40, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Tại sao chọn <span className="text-emerald-400">AGRIOS</span>?
                            </h2>

                            <div className="space-y-4">
                                {[
                                    "Miễn phí 100% cho nông dân - không phí ẩn",
                                    "AI tự động 80% công việc marketing & sales",
                                    "Realtime inventory sync - vườn → khách hàng",
                                    "Cold chain IoT - hoa tươi 100% khi giao",
                                    "24/7 support - Hotline + AI Copilot",
                                    "Truy xuất nguồn gốc blockchain - minh bạch",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="text-stone-300">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold mt-8 transition-colors"
                            >
                                Tham gia ngay <ChevronRight className="w-5 h-5" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ x: 40, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-3xl border border-emerald-500/30 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-8xl mb-4">🌸</div>
                                    <div className="text-2xl font-bold text-white">Sa Đéc</div>
                                    <div className="text-emerald-400">Làng Hoa #1 Việt Nam</div>
                                </div>
                            </div>

                            {/* Floating badges */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute -top-4 -right-4 bg-amber-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg"
                            >
                                🎊 Tết 2025
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -bottom-4 -left-4 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg"
                            >
                                🚀 LIVE NOW
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl p-8 md:p-12 text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Sẵn sàng số hóa vườn hoa?
                        </h2>
                        <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                            Tham gia cùng 500+ nhà vườn Sa Đéc đã tin tưởng sử dụng AGRIOS.tech
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/register?role=farmer"
                                className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2"
                            >
                                🌸 Đăng ký Nhà Vườn
                            </Link>
                            <Link
                                href="/register?role=buyer"
                                className="bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-800 transition-colors flex items-center gap-2 border border-emerald-500"
                            >
                                🎯 Mua Hoa Tết
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-stone-800">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="text-2xl font-bold mb-4">
                        <span className="text-emerald-400">AGRIOS</span>
                        <span className="text-white">.tech</span>
                    </div>
                    <p className="text-stone-500 text-sm">
                        © 2025 AGRIOS Technology. Nền tảng nông nghiệp thông minh.
                    </p>
                    <div className="flex justify-center gap-6 mt-6 text-stone-400 text-sm">
                        <Link href="/terms" className="hover:text-white">Điều khoản</Link>
                        <Link href="/privacy" className="hover:text-white">Bảo mật</Link>
                        <Link href="/contact" className="hover:text-white">Liên hệ</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
