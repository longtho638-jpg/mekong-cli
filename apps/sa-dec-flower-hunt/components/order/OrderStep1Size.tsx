"use client";

import { SizeKey, formatPrice } from "@/data/flowers";
import SizePicker from "../SizePicker";
import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface OrderStep1SizeProps {
    selectedSize: SizeKey;
    availableSizes: SizeKey[];
    basePrice: number;
    quantity: number;
    totalPrice: number;
    onSizeChange: (size: SizeKey) => void;
    onQuantityChange: (quantity: number) => void;
    onNext: () => void;
    singlePageMode?: boolean;
}

export function OrderStep1Size({
    selectedSize,
    availableSizes,
    basePrice,
    quantity,
    totalPrice,
    onSizeChange,
    onQuantityChange,
    onNext,
    singlePageMode = false
}: OrderStep1SizeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <SizePicker
                selectedSize={selectedSize}
                availableSizes={availableSizes}
                basePrice={basePrice}
                onSelect={onSizeChange}
            />

            {/* Quantity */}
            <div className="mt-6">
                <h3 className="font-bold text-stone-800 mb-3">Số Lượng</h3>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                        className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                    <button
                        onClick={() => onQuantityChange(quantity + 1)}
                        className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Total & Action */}
            {!singlePageMode && (
                <div className="mt-6 bg-stone-50 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-sm text-stone-500">Tổng cộng</p>
                        <p className="text-lg font-bold text-red-600">
                            {formatPrice(totalPrice)}
                        </p>
                    </div>
                    <Button onClick={onNext} className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6">
                        Tiếp tục
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
