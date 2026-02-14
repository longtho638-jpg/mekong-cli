"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";

interface PartnerLoginProps {
    onLogin: (phone: string) => void;
}

export function PartnerLogin({ onLogin }: PartnerLoginProps) {
    const [phone, setPhone] = useState("");

    const handleLogin = () => {
        if (phone.length >= 10) {
            onLogin(phone);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
                <div className="text-center mb-8">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-6xl mb-4"
                    >
                        🌸
                    </motion.div>
                    <h1 className="text-2xl font-bold text-stone-800">Partner Dashboard</h1>
                    <p className="text-stone-500 mt-2">Đăng nhập bằng SĐT đã đăng ký</p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Số điện thoại nhà vườn"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-lg"
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>

                    <motion.button
                        onClick={handleLogin}
                        disabled={phone.length < 10}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50"
                    >
                        Đăng Nhập
                    </motion.button>
                </div>

                <p className="text-center text-stone-400 text-sm mt-6">
                    Chưa có tài khoản? Liên hệ Admin
                </p>
            </motion.div>
        </div>
    );
}
