'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
    Heart,
    Sparkles,
    Gift,
    Video,
    Truck,
    Star,
    CheckCircle2,
    ArrowRight,
    Phone,
    Mail,
    MapPin,
    Clock,
    Users,
    Camera,
    MessageCircle
} from 'lucide-react'

const useTypewriter = (text: string, speed: number = 50) => {
    const [displayText, setDisplayText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        let i = 0
        setDisplayText('')
        setIsComplete(false)

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.slice(0, i + 1))
                i++
            } else {
                setIsComplete(true)
                clearInterval(timer)
            }
        }, speed)

        return () => clearInterval(timer)
    }, [text, speed])

    return { displayText, isComplete }
}

export default function Founding10Page() {
    const [slotsLeft, setSlotsLeft] = useState(7)
    const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        why: ''
    })

    const { displayText, isComplete } = useTypewriter(
        'Chúng tôi đang tìm 10 người đầu tiên để nhận hoa MIỄN PHÍ từ làng hoa Sa Đéc...',
        40
    )

    // Fetch current slots from database
    useEffect(() => {
        async function fetchSlots() {
            if (!supabase) return;

            const { count } = await supabase
                .from('founding_customers')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed')

            if (count !== null) {
                setSlotsLeft(Math.max(0, 10 - count))
            }
        }
        fetchSlots()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supabase) {
            setFormState('error')
            return
        }
        setFormState('submitting')

        try {
            const { error } = await supabase.from('founding_customers').insert({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                why_interested: formData.why,
                status: 'pending'
            })

            if (error) throw error

            setFormState('success')
            setSlotsLeft(prev => Math.max(0, prev - 1))
        } catch {
            setFormState('error')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-emerald-950 relative">
            {/* Texture Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-10 mix-blend-overlay" />
            </div>
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
                    <motion.div
                        className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
                        transition={{ duration: 10, repeat: Infinity }}
                    />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-300 text-sm font-medium">Chương trình đặc biệt • Chỉ 10 người</span>
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                    >
                        <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                            Founding 10
                        </span>
                        <br />
                        <span className="text-3xl md:text-4xl lg:text-5xl text-stone-300">
                            Những người đầu tiên
                        </span>
                    </motion.h1>

                    {/* Typewriter text */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl md:text-2xl text-stone-400 mb-8 h-16"
                    >
                        {displayText}
                        {!isComplete && <span className="animate-pulse">|</span>}
                    </motion.p>

                    {/* Slots counter */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl mb-12"
                    >
                        <div className="flex -space-x-2">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-stone-900 flex items-center justify-center"
                                >
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="text-3xl font-bold text-white">{slotsLeft}/10</div>
                            <div className="text-sm text-emerald-400">slots còn lại</div>
                        </div>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        transition={{ delay: 1, duration: 2, repeat: Infinity }}
                        className="flex flex-col items-center gap-2"
                    >
                        <span className="text-stone-500 text-sm">Scroll để biết thêm</span>
                        <ArrowRight className="w-5 h-5 text-stone-500 rotate-90" />
                    </motion.div>
                </div>
            </section>

            {/* What You Get Section */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Bạn sẽ nhận được gì?
                        </h2>
                        <p className="text-stone-400 text-lg">
                            Hoàn toàn MIỄN PHÍ. Không cam kết. Không bắt buộc.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Gift,
                                title: 'FREE Bó Hoa Tươi',
                                desc: 'Một bó hoa tươi từ vườn Sa Đéc, trị giá 300.000đ',
                                color: 'from-pink-500 to-rose-500'
                            },
                            {
                                icon: Truck,
                                title: 'FREE Ship Tận Nhà',
                                desc: 'Giao hàng miễn phí đến tận cửa nhà bạn',
                                color: 'from-emerald-500 to-teal-500'
                            },
                            {
                                icon: Video,
                                title: 'Video Call Với Nông Dân',
                                desc: 'Trò chuyện trực tiếp với người trồng hoa',
                                color: 'from-blue-500 to-cyan-500'
                            },
                            {
                                icon: Camera,
                                title: 'Xem Hoa Được Cắt LIVE',
                                desc: 'Chứng kiến bông hoa của bạn được cắt từ vườn',
                                color: 'from-amber-500 to-orange-500'
                            },
                            {
                                icon: Clock,
                                title: 'Giao Trong 6 Giờ',
                                desc: 'Cold-chain logistics đảm bảo hoa tươi nhất',
                                color: 'from-purple-500 to-indigo-500'
                            },
                            {
                                icon: Heart,
                                title: 'Thiệp Viết Tay',
                                desc: 'Lời cảm ơn từ nông dân, viết tay từng chữ',
                                color: 'from-red-500 to-pink-500'
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-6 bg-stone-900/50 border border-stone-800 rounded-2xl hover:border-stone-700 transition-all"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-stone-400 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What We Ask Section */}
            <section className="py-20 px-6 bg-stone-900/50">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Đổi lại, chúng tôi xin bạn...
                        </h2>
                        <p className="text-stone-400 text-lg">
                            Chỉ 2 điều nhỏ để giúp chúng tôi phát triển
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                                <Star className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">1 Review Thật</h3>
                            <p className="text-stone-400">
                                Chia sẻ cảm nhận thật của bạn về hoa - đẹp, xấu, hay gì cũng được.
                                Chúng tôi cần feedback thật để cải thiện.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="p-8 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/30 rounded-2xl"
                        >
                            <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mb-6">
                                <Camera className="w-8 h-8 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">1 Ảnh Khi Nhận Hoa</h3>
                            <p className="text-stone-400">
                                Một tấm ảnh đơn giản khi bạn nhận được hoa.
                                Chúng tôi sẽ xin phép trước khi đăng public.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-8 md:p-12 bg-gradient-to-br from-stone-900 to-stone-800 border border-stone-700 rounded-3xl"
                    >
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Tại sao chúng tôi làm điều này?</h3>
                                <p className="text-stone-500 text-sm">Từ founder</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-stone-300 leading-relaxed">
                            <p>
                                "Tôi là một người con Sa Đéc. Lớn lên giữa những vườn hoa, tôi thấy bà con nông dân
                                thức dậy từ 4 giờ sáng, làm việc cả ngày, nhưng lợi nhuận phần lớn rơi vào tay trung gian."
                            </p>
                            <p>
                                "Tôi muốn thay đổi điều đó. AGRIOS.tech kết nối trực tiếp nông dân với khách hàng.
                                Không trung gian. Hoa tươi hơn. Giá tốt hơn cho cả hai phía."
                            </p>
                            <p className="text-white font-medium">
                                "10 người đầu tiên này sẽ giúp chúng tôi chứng minh rằng mô hình này khả thi.
                                Và tôi muốn cảm ơn các bạn bằng hoa - MIỄN PHÍ, từ đáy lòng."
                            </p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-stone-700 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                            <div>
                                <div className="text-white font-medium">Long Thọ</div>
                                <div className="text-stone-500 text-sm">Founder, AGRIOS.tech</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Form Section */}
            <section id="form" className="py-20 px-6 bg-gradient-to-b from-transparent to-emerald-950/50">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Đăng ký nhận hoa FREE
                        </h2>
                        <p className="text-stone-400">
                            Còn <span className="text-emerald-400 font-bold">{slotsLeft} slots</span>.
                            First come, first serve.
                        </p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {formState === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Đăng ký thành công!</h3>
                                <p className="text-stone-300 mb-6">
                                    Chúng tôi sẽ liên hệ bạn trong vòng 24 giờ để xác nhận và lên lịch giao hoa.
                                </p>
                                <p className="text-emerald-400">
                                    Welcome to the Founding 10! 🌸
                                </p>
                            </motion.div>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onSubmit={handleSubmit}
                                className="p-8 bg-stone-900/80 border border-stone-700 rounded-2xl space-y-6"
                            >
                                <div>
                                    <label className="block text-stone-300 text-sm mb-2">
                                        <Users className="w-4 h-4 inline mr-2" />
                                        Tên của bạn *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-stone-300 text-sm mb-2">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Số điện thoại *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="0901234567"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-stone-300 text-sm mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-stone-300 text-sm mb-2">
                                        <MapPin className="w-4 h-4 inline mr-2" />
                                        Địa chỉ giao hoa *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh"
                                    />
                                </div>

                                <div>
                                    <label className="block text-stone-300 text-sm mb-2">
                                        <Heart className="w-4 h-4 inline mr-2" />
                                        Tại sao bạn muốn tham gia?
                                    </label>
                                    <textarea
                                        value={formData.why}
                                        onChange={e => setFormData({ ...formData, why: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                        placeholder="Tôi thích hoa và muốn thử trải nghiệm mới..."
                                    />
                                </div>

                                {formState === 'error' && (
                                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                                        Có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ qua Zalo.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={formState === 'submitting' || slotsLeft === 0}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-stone-600 disabled:to-stone-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {formState === 'submitting' ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang gửi...
                                        </>
                                    ) : slotsLeft === 0 ? (
                                        'Đã hết slots'
                                    ) : (
                                        <>
                                            Đăng ký nhận hoa FREE
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-stone-500 text-sm">
                                    Chúng tôi sẽ liên hệ bạn trong vòng 24 giờ
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-stone-800">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                        AGRIOS.tech
                    </div>
                    <p className="text-stone-500 text-sm mb-6">
                        Hoa tươi từ làng hoa Sa Đéc • Giao trong 6 giờ
                    </p>
                    <div className="flex items-center justify-center gap-6 text-stone-500 text-sm">
                        <a href="tel:0901234567" className="hover:text-white transition-colors flex items-center gap-2">
                            <Phone className="w-4 h-4" /> 0901234567
                        </a>
                        <a href="mailto:hello@agrios.tech" className="hover:text-white transition-colors flex items-center gap-2">
                            <Mail className="w-4 h-4" /> hello@agrios.tech
                        </a>
                    </div>
                </div>
            </footer>
        </div>

    )
}
