"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, User, Send, Ticket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function CheckInForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Get Location (Optional)
            let location = { lat: null, lng: null };
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    location = {
                        lat: pos.coords.latitude as any,
                        lng: pos.coords.longitude as any
                    };
                } catch (err) {
                    console.log("Location denied or timeout", err);
                }
            }

            // 2. Insert into Supabase
            if (!supabase) return;
            const { error } = await supabase.from('festival_leads').insert({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                location_lat: location.lat,
                location_lng: location.lng,
                device_info: navigator.userAgent
            });

            if (error) throw error;

            setSuccess(true);
            toast.success("Check-in thành công!", {
                description: "Voucher đã được gửi tới số điện thoại của bạn."
            });

        } catch (error: any) {
            console.error("Check-in error:", error);
            toast.error("Lỗi Check-in", {
                description: error.message || "Vui lòng thử lại sau."
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 shadow-xl text-center border-2 border-green-100"
            >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ticket className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-2">Check-in Thành Công!</h3>
                <p className="text-stone-500 mb-6">Chào mừng bạn đến với Sa Đéc Flower Hunt 2026.</p>

                <div className="bg-stone-50 border-dashed border-2 border-stone-200 p-4 rounded-xl mb-6">
                    <p className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-1">Mã Voucher Của Bạn</p>
                    <p className="text-3xl font-mono font-bold text-green-600 tracking-widest">SADEC26</p>
                </div>

                <p className="text-sm text-stone-400 italic">
                    *Đưa mã này cho các gian hàng để được giảm giá 10%
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600 pl-1">Họ và Tên</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        required
                        placeholder="Nguyễn Văn A"
                        className="pl-10 h-12 bg-white"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600 pl-1">Số Điện Thoại</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        required
                        type="tel"
                        placeholder="0912..."
                        className="pl-10 h-12 bg-white"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600 pl-1">Email <span className="text-stone-400 font-normal">(Tùy chọn)</span></label>
                <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        type="email"
                        placeholder="email@example.com"
                        className="pl-10 h-12 bg-white"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Chúng tôi sẽ ghi nhận vị trí của bạn để xác thực việc Check-in tại Làng Hoa.</p>
            </div>

            <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg shadow-lg shadow-green-900/20"
                disabled={loading}
            >
                {loading ? "Đang xử lý..." : "Nhận Voucher Ngay"} <Send className="w-4 h-4 ml-2" />
            </Button>
        </form>
    );
}
