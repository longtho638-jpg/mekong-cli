"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Loader2, Terminal, CheckCircle, User, MapPin, Flower2, ArrowLeft, ArrowRight } from "lucide-react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function PartnerRegisterForm() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        garden_name: "",
        address: "",
        flower_types: ""
    })

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleNext = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (!supabase) {
                console.error("Supabase not configured")
                return
            }

            const { error } = await supabase.from('partner_leads').insert({
                full_name: formData.full_name,
                phone: formData.phone,
                garden_name: formData.garden_name,
                address: formData.address,
                flower_types: formData.flower_types,
                status: 'new'
            })

            if (error) throw error

            setIsLoading(false)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399', '#6ee7b7']
            })

            setTimeout(() => {
                router.push("/partner")
            }, 1500)
        } catch (error) {
            console.error("Partner reg error", error)
            setIsLoading(false)
        }
    }

    const steps = [
        { num: 1, icon: User, label: "Cá nhân" },
        { num: 2, icon: MapPin, label: "Vườn" },
        { num: 3, icon: Flower2, label: "Xác nhận" }
    ]

    return (
        <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
            {/* Background Image */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_farmer_hyperreal_1765367316910.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black pointer-events-none" />
            </div>

            {/* Ambient Glow */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Terminal className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs text-emerald-500 uppercase tracking-wider font-bold">
                            Partner_Registration
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Đăng Ký Đối Tác</h1>
                    <p className="text-stone-500 text-sm mt-1">Gia nhập mạng lưới Sa Đéc Flower Hunt</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center border transition-all
                                ${step >= s.num
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                    : 'bg-stone-900 border-stone-800 text-stone-600'}
                            `}>
                                {step > s.num ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <s.icon className="w-5 h-5" />
                                )}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-emerald-500' : 'bg-stone-800'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <motion.div
                    className="bg-stone-950 border border-emerald-500/30 rounded-lg overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <form onSubmit={handleSubmit}>
                        {/* Card Header */}
                        <div className="border-b border-emerald-500/20 px-6 py-4">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                {step === 1 && "Thông_Tin_Cá_Nhân"}
                                {step === 2 && "Thông_Tin_Vườn"}
                                {step === 3 && "Xác_Nhận_Đăng_Ký"}
                            </h2>
                            <p className="text-xs text-stone-500 mt-1">
                                {step === 1 && "Cho chúng tôi biết bạn là ai."}
                                {step === 2 && "Vườn của bạn ở đâu và trồng hoa gì?"}
                                {step === 3 && "Kiểm tra lại thông tin và xác nhận."}
                            </p>
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -20, opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                                Họ và tên *
                                            </Label>
                                            <Input
                                                name="full_name"
                                                placeholder="Nguyễn Văn A"
                                                required
                                                value={formData.full_name}
                                                onChange={(e) => updateFormData('full_name', e.target.value)}
                                                className="bg-black border-stone-800 text-white placeholder:text-stone-600 focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                                Số điện thoại Zalo *
                                            </Label>
                                            <Input
                                                name="phone"
                                                type="tel"
                                                placeholder="0901 234 567"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => updateFormData('phone', e.target.value)}
                                                className="bg-black border-stone-800 text-white placeholder:text-stone-600 focus:border-emerald-500"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -20, opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                                Tên vườn hoa
                                            </Label>
                                            <Input
                                                name="garden_name"
                                                placeholder="Vườn Hoa ABC"
                                                value={formData.garden_name}
                                                onChange={(e) => updateFormData('garden_name', e.target.value)}
                                                className="bg-black border-stone-800 text-white placeholder:text-stone-600 focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                                Địa chỉ vườn *
                                            </Label>
                                            <Input
                                                name="address"
                                                placeholder="123 Đường Hoa, Sa Đéc"
                                                required
                                                value={formData.address}
                                                onChange={(e) => updateFormData('address', e.target.value)}
                                                className="bg-black border-stone-800 text-white placeholder:text-stone-600 focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                                Loại hoa trồng
                                            </Label>
                                            <Textarea
                                                name="flower_types"
                                                placeholder="Hoa hồng, hoa cúc, hoa mai..."
                                                value={formData.flower_types}
                                                onChange={(e) => updateFormData('flower_types', e.target.value)}
                                                className="bg-black border-stone-800 text-white placeholder:text-stone-600 focus:border-emerald-500 min-h-[80px]"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -20, opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="bg-black border border-stone-800 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-500">Họ tên:</span>
                                                <span className="text-white font-medium">{formData.full_name || "-"}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-500">Điện thoại:</span>
                                                <span className="text-white font-medium">{formData.phone || "-"}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-500">Tên vườn:</span>
                                                <span className="text-white font-medium">{formData.garden_name || "-"}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-500">Địa chỉ:</span>
                                                <span className="text-white font-medium text-right max-w-[200px]">{formData.address || "-"}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-500">Loại hoa:</span>
                                                <span className="text-white font-medium text-right max-w-[200px]">{formData.flower_types || "-"}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-stone-600 text-center">
                                            Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ của chúng tôi.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Card Footer */}
                        <div className="border-t border-emerald-500/20 px-6 py-4 flex justify-between">
                            {step > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="border-stone-800 text-stone-400 hover:bg-stone-900 hover:text-white"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Quay lại
                                </Button>
                            ) : (
                                <Link href="/partner/register">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-stone-800 text-stone-400 hover:bg-stone-900 hover:text-white"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Trang chủ
                                    </Button>
                                </Link>
                            )}

                            {step < 3 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                                >
                                    Tiếp tục
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Đăng ký & Vào Farm OS
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
