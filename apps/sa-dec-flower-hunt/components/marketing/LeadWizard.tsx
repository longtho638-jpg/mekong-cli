"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sprout,
    ShoppingBag,
    Building2,
    Package,
    Truck,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Loader2,
    X,
    Zap,
    Phone,
    FlaskConical,
    Landmark,
    Newspaper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const ROLES = [
    { id: "farmer", icon: Sprout, label: "Nhà Vườn", desc: "Bán hoa trực tiếp", color: "emerald" },
    { id: "buyer", icon: ShoppingBag, label: "Người Mua", desc: "Mua hoa tận gốc", color: "cyan" },
    { id: "bank", icon: Building2, label: "Ngân Hàng", desc: "Đối tác tín dụng", color: "amber" },
    { id: "supplier", icon: Package, label: "Nhà Cung Cấp", desc: "Bán vật tư", color: "purple" },
    { id: "logistics", icon: Truck, label: "Shipper", desc: "Đối tác vận chuyển", color: "rose" },
    { id: "research", icon: FlaskConical, label: "R&D / Đại Học", desc: "Nghiên cứu & IP", color: "blue" },
    { id: "government", icon: Landmark, label: "Chính Phủ / NGO", desc: "OCOP, Nông thôn mới", color: "indigo" },
    { id: "media", icon: Newspaper, label: "Báo Chí", desc: "Phóng viên, Media", color: "pink" },
] as const;

type Role = typeof ROLES[number]["id"];

interface LeadWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialRole?: Role;
}

export function LeadWizard({ isOpen, onClose, initialRole }: LeadWizardProps) {
    const [step, setStep] = useState(initialRole ? 2 : 1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        role: initialRole || "" as Role | "",
        name: "",
        phone: "",
        email: "",
        company: "",
        farmSize: "",
        productTypes: ""
    });

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRoleSelect = (role: Role) => {
        setFormData(prev => ({ ...prev, role }));
        setStep(2);
    };

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            if (supabase) {
                const { error } = await supabase.from("leads").insert({
                    role: formData.role,
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email || null,
                    company: formData.company || null,
                    farm_size: formData.farmSize || null,
                    product_types: formData.productTypes ? formData.productTypes.split(",").map(s => s.trim()) : null,
                    source: "landing",
                    status: "new"
                });

                if (error) throw error;
            }

            setIsLoading(false);
            setStep(4);

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399', '#6ee7b7']
            });

            toast.success("Đăng ký thành công!", {
                description: "Chúng tôi sẽ liên hệ bạn trong 24h"
            });
        } catch (error) {
            console.error("Lead capture error:", error);
            setIsLoading(false);
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        }
    };

    const selectedRole = ROLES.find(r => r.id === formData.role);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-lg bg-stone-950 border border-emerald-500/30 rounded-lg overflow-hidden font-mono"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-emerald-500/20 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">
                            {step === 1 && "Chọn Vai Trò"}
                            {step === 2 && "Thông Tin Liên Hệ"}
                            {step === 3 && "Chi Tiết"}
                            {step === 4 && "Hoàn Tất!"}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-stone-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-stone-900">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Role Selection */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-4"
                            >
                                <p className="text-stone-400 text-sm mb-4">
                                    Bạn thuộc nhóm đối tượng nào trong chuỗi giá trị?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {ROLES.map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleRoleSelect(role.id)}
                                            className={`
                                                p-4 border rounded-lg text-left transition-all
                                                hover:border-emerald-500/50 hover:bg-emerald-950/20
                                                ${role.id === "farmer"
                                                    ? "border-emerald-500/50 bg-emerald-950/30 col-span-2"
                                                    : "border-stone-800 bg-black"}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <role.icon className={`w-5 h-5 ${role.id === "farmer" ? "text-emerald-400" : "text-stone-500"}`} />
                                                <div>
                                                    <div className="font-bold text-white text-sm">{role.label}</div>
                                                    <div className="text-[10px] text-stone-500">{role.desc}</div>
                                                </div>
                                                {role.id === "farmer" && (
                                                    <span className="ml-auto text-[9px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold">
                                                        HOT
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Contact Info */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-4"
                            >
                                {selectedRole && (
                                    <div className="flex items-center gap-2 mb-4 text-xs text-emerald-400">
                                        <selectedRole.icon className="w-4 h-4" />
                                        <span>{selectedRole.label}</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                        Họ và tên *
                                    </Label>
                                    <Input
                                        placeholder="Nguyễn Văn A"
                                        value={formData.name}
                                        onChange={(e) => updateFormData("name", e.target.value)}
                                        className="bg-black border-stone-800 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                        Số điện thoại (Zalo) *
                                    </Label>
                                    <Input
                                        type="tel"
                                        placeholder="0901 234 567"
                                        value={formData.phone}
                                        onChange={(e) => updateFormData("phone", e.target.value)}
                                        className="bg-black border-stone-800 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                        Email (tuỳ chọn)
                                    </Label>
                                    <Input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={(e) => updateFormData("email", e.target.value)}
                                        className="bg-black border-stone-800 text-white"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Role-Specific */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-4"
                            >
                                {formData.role === "farmer" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                                Quy mô vườn (số chậu/cây)
                                            </Label>
                                            <Input
                                                placeholder="VD: 500 chậu"
                                                value={formData.farmSize}
                                                onChange={(e) => updateFormData("farmSize", e.target.value)}
                                                className="bg-black border-stone-800 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                                Loại hoa chính
                                            </Label>
                                            <Input
                                                placeholder="VD: Hoa hồng, cúc, mai..."
                                                value={formData.productTypes}
                                                onChange={(e) => updateFormData("productTypes", e.target.value)}
                                                className="bg-black border-stone-800 text-white"
                                            />
                                        </div>
                                    </>
                                )}
                                {formData.role !== "farmer" && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-stone-400 uppercase tracking-wider">
                                            Tên công ty / Tổ chức
                                        </Label>
                                        <Input
                                            placeholder="VD: Công ty ABC"
                                            value={formData.company}
                                            onChange={(e) => updateFormData("company", e.target.value)}
                                            className="bg-black border-stone-800 text-white"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 4: Success */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Đăng Ký Thành Công!
                                </h3>
                                <p className="text-stone-400 text-sm mb-6">
                                    Chúng tôi sẽ liên hệ qua Zalo trong 24h
                                </p>
                                <Button
                                    onClick={onClose}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                                >
                                    <Phone className="w-4 h-4 mr-2" />
                                    Liên hệ ngay qua Zalo
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                {step > 1 && step < 4 && (
                    <div className="border-t border-emerald-500/20 px-6 py-4 flex justify-between">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="border-stone-800 text-stone-400"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Quay lại
                        </Button>

                        {step < 3 ? (
                            <Button
                                onClick={handleNext}
                                disabled={step === 2 && (!formData.name || !formData.phone)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                            >
                                Tiếp tục
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Hoàn tất đăng ký
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
