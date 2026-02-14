"use client";

import { motion } from "framer-motion";
import { User, Phone, MapPin, Loader2 } from "lucide-react";
import { formatPrice } from "@/data/flowers";
import Image from "next/image";

interface OrderStep3ConfirmProps {
    flowerName: string;
    flowerImage: string;
    selectedSize: string;
    quantity: number;
    totalPrice: number;
    name: string;
    phone: string;
    address: string;
    isLoading: boolean;
    onBack: () => void;
    onSubmit: () => void;
}

export function OrderStep3Confirm({
    flowerName,
    flowerImage,
    selectedSize,
    quantity,
    totalPrice,
    name,
    phone,
    address,
    isLoading,
    onBack,
    onSubmit
}: OrderStep3ConfirmProps) {
    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <h3 className="font-bold text-stone-800 mb-4">Xác Nhận Đơn Hàng</h3>

            {/* Order Summary */}
            <div className="bg-stone-50 rounded-2xl p-4 mb-4">
                <div className="flex gap-3 items-center mb-3">
                    <Image
                        src={flowerImage}
                        alt={flowerName}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                        <p className="font-bold text-stone-800">{flowerName}</p>
                        <p className="text-sm text-stone-500">Size {selectedSize} x {quantity}</p>
                    </div>
                </div>
                <div className="border-t pt-3 flex justify-between">
                    <span className="text-stone-600">Thành tiền:</span>
                    <span className="font-bold text-red-600">{formatPrice(totalPrice)}</span>
                </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-stone-50 rounded-2xl p-4 mb-4 space-y-2">
                <div className="flex gap-2">
                    <User className="w-4 h-4 text-stone-400 mt-0.5" />
                    <span className="text-stone-700">{name}</span>
                </div>
                <div className="flex gap-2">
                    <Phone className="w-4 h-4 text-stone-400 mt-0.5" />
                    <span className="text-stone-700">{phone}</span>
                </div>
                <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-stone-400 mt-0.5" />
                    <span className="text-stone-700">{address}</span>
                </div>
            </div>

            {/* Payment Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                    💵 <strong>Thanh toán khi nhận hàng (COD)</strong>
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 bg-stone-100 text-stone-700 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                >
                    ← Sửa
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            ✓ Đặt Hàng
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
