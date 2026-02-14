"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { formatPrice } from "@/data/flowers";
import Image from "next/image";

interface OrderSuccessProps {
    orderId: string;
    flowerName: string;
    flowerImage: string;
    selectedSize: string;
    quantity: number;
    totalPrice: number;
}

export function OrderSuccess({
    orderId,
    flowerName,
    flowerImage,
    selectedSize,
    quantity,
    totalPrice
}: OrderSuccessProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 text-center border border-green-200"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-green-800 mb-2">
                Đặt Hàng Thành Công! 🎉
            </h2>

            <p className="text-green-600 mb-4">
                Mã đơn hàng: <span className="font-mono font-bold">{orderId}</span>
            </p>

            <div className="bg-white rounded-2xl p-4 mb-4 text-left">
                <div className="flex gap-3 items-center">
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
                        <p className="font-bold text-red-600">{formatPrice(totalPrice)}</p>
                    </div>
                </div>
            </div>

            <p className="text-sm text-green-600">
                📱 Chúng tôi sẽ gọi xác nhận trong 30 phút!
            </p>
        </motion.div>
    );
}
