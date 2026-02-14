"use client";

import { useState } from "react";
import { Phone, Heart, Loader2, CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface LeadCaptureFormProps {
    flowerId: number;
    flowerName: string;
}

export default function LeadCaptureForm({ flowerId, flowerName }: LeadCaptureFormProps) {
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const validatePhone = (value: string) => {
        // Vietnamese phone: 10 digits starting with 0
        const cleaned = value.replace(/\D/g, "");
        return /^0[0-9]{9}$/.test(cleaned);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validatePhone(phone)) {
            setError("Vui lòng nhập số điện thoại hợp lệ (10 số)");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phone.replace(/\D/g, ""),
                    flowerId,
                    flowerName,
                }),
            });

            if (!response.ok) {
                throw new Error("Có lỗi xảy ra");
            }

            // AARRR: Activation
            // AARRR: Activation
            await trackEvent("lead_capture", {
                action: "lead_form_submit",
                flower_id: flowerId,
                flower_name: flowerName,
                phone_hash: phone.replace(/\D/g, "").slice(-3) // Privacy
            });

            setIsSuccess(true);
        } catch (err) {
            setError("Không thể gửi. Vui lòng thử lại!");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-3xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-800 mb-1">
                    Đã ghi nhận! 🎉
                </h3>
                <p className="text-green-600 text-sm">
                    Chúng tôi sẽ gửi báo giá {flowerName} cho bạn sau Tết.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-red-50 to-yellow-50 border border-red-100 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                    <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h3 className="font-bold text-stone-800">Tết Này Bạn Muốn Mua?</h3>
                    <p className="text-xs text-stone-500">Đăng ký nhận báo giá sỉ/lẻ 2026</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Số điện thoại của bạn"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-stone-800 placeholder:text-stone-400"
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <Heart className="w-5 h-5" />
                            Tôi Quan Tâm {flowerName}
                        </>
                    )}
                </button>
            </form>

            <p className="text-xs text-stone-400 text-center mt-3">
                🔒 Thông tin của bạn được bảo mật tuyệt đối
            </p>
        </div>
    );
}
