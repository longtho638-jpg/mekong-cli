"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Gift, Trophy, QrCode, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Confetti from "react-confetti";

export default function FestivalCheckInPage() {
    const [step, setStep] = useState<"location" | "form" | "reward">("location");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [voucher, setVoucher] = useState("");
    const [distance, setDistance] = useState(0);

    // Real Geolocation Check
    const handleCheckIn = () => {
        setLoading(true);
        setErrorMsg("");

        if (!navigator.geolocation) {
            setErrorMsg("Thiết bị không hỗ trợ định vị. Hãy thử bằng điện thoại.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                // For UX, we verify GPS locally or just move to next step and verify on server
                // Here we simulate a quick "Locating..." and move to form
                setTimeout(() => {
                    setLoading(false);
                    setStep("form");
                }, 1000);
            },
            (error) => {
                console.error(error);
                setErrorMsg("Không thể lấy vị trí. Vui lòng bật GPS và cho phép truy cập.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch('/api/festival/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    lat: location?.lat,
                    lng: location?.lng,
                    device_info: navigator.userAgent
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Có lỗi xảy ra");
            }

            setVoucher(data.voucher);
            setDistance(data.distance);
            setStep("reward");
        } catch (err: any) {
            setErrorMsg(err.message || "Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 p-4 flex items-center justify-center text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>

            {step === "reward" && <Confetti numberOfPieces={200} recycle={false} />}

            <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-white text-shadow-sm">Sa Đéc 2026</h1>
                    <p className="text-white/80 font-medium">Lễ Hội Hoa Xuân - Check-in & Nhận Quà</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === "location" && (
                        <motion.div
                            key="location"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-black/20 p-4 rounded-2xl border border-white/10 text-center">
                                <MapPin className="w-8 h-8 mx-auto mb-2 text-yellow-300 animate-bounce" />
                                <p className="text-sm">Bạn đang ở khu vực Lễ Hội?</p>
                                <p className="text-xs opacity-70 mt-1">Hệ thống sẽ xác nhận vị trí GPS của bạn</p>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-500/80 p-3 rounded-lg text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {errorMsg}
                                </div>
                            )}

                            <Button
                                onClick={handleCheckIn}
                                disabled={loading}
                                className="w-full h-14 bg-white text-red-600 font-bold text-lg hover:bg-gray-100 shadow-lg"
                            >
                                {loading ? "Đang định vị..." : "📍 XÁC NHẬN VỊ TRÍ NGAY"}
                            </Button>
                        </motion.div>
                    )}

                    {step === "form" && (
                        <motion.div
                            key="form"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="text-center space-y-2">
                                <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-bold">Đã tìm thấy vị trí</span>
                                </div>
                                <h3 className="font-bold text-xl">Một bước nữa thôi!</h3>
                                <p className="text-sm opacity-80">Nhập thông tin để nhận Voucher vào SĐT</p>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-500/80 p-3 rounded-lg text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    placeholder="Tên của bạn"
                                    className="h-12 bg-white/90 text-black border-0 placeholder:text-stone-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    placeholder="Số điện thoại Zalo"
                                    className="h-12 bg-white/90 text-black border-0 placeholder:text-stone-500"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                                <Input
                                    placeholder="Email (Để nhận Voucher)"
                                    className="h-12 bg-white/90 text-black border-0 placeholder:text-stone-500"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-yellow-400 text-red-700 font-bold text-lg hover:bg-yellow-300 shadow-lg mt-2"
                                >
                                    {loading ? "Đang gửi..." : "MỞ HỘP QUÀ 🎁"}
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {step === "reward" && (
                        <motion.div
                            key="reward"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Gift className="w-32 h-32 mx-auto text-yellow-300 drop-shadow-2xl" />
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute top-0 right-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/50 rotate-12"
                                >
                                    +500 ĐIỂM
                                </motion.div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">CHÚC MỪNG!</h2>
                                <p className="text-lg font-medium text-yellow-100">Bạn nhận được Voucher 50K</p>
                                <p className="text-sm opacity-70 mt-1">Mã đã được gửi qua Zalo của bạn</p>
                                {distance > 0 && <p className="text-[10px] opacity-50 mt-2">Khoảng cách xác thực: {distance.toFixed(1)}km</p>}
                            </div>

                            <div className="bg-white/90 text-black p-4 rounded-xl">
                                <div className="text-xs font-mono text-stone-500 uppercase tracking-wide mb-1">Mã Voucher</div>
                                <div className="text-2xl font-bold font-mono tracking-wider text-red-600">{voucher}</div>
                            </div>

                            <Button
                                className="w-full bg-black/30 hover:bg-black/40 text-white border border-white/30 backdrop-blur-sm"
                                onClick={() => window.location.href = '/'}
                            >
                                Về Trang Chủ Săn Hoa
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute bottom-4 text-center w-full text-white/40 text-xs">
                Powered by Sa Dec Flower Hunt Platform
            </div>
        </div>
    );
}
