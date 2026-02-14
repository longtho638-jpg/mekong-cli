"use client";

import { SIZES, SizeKey } from "@/data/flowers";
import { motion } from "framer-motion";

interface SizePickerProps {
    selectedSize: SizeKey;
    availableSizes: SizeKey[];
    basePrice: number;
    onSelect: (size: SizeKey) => void;
}

export default function SizePicker({ selectedSize, availableSizes, basePrice, onSelect }: SizePickerProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {(Object.keys(SIZES) as SizeKey[]).map((size) => {
                const sizeInfo = SIZES[size];
                const isAvailable = availableSizes.includes(size);
                const isSelected = selectedSize === size;
                const price = Math.round(basePrice * sizeInfo.multiplier);

                return (
                    <motion.button
                        key={size}
                        onClick={() => isAvailable && onSelect(size)}
                        disabled={!isAvailable}
                        whileHover={isAvailable ? { scale: 1.02 } : {}}
                        whileTap={isAvailable ? { scale: 0.98 } : {}}
                        className={`
              relative p-4 rounded-2xl border-2 transition-all text-left
              ${isSelected
                                ? "border-red-500 bg-red-50 shadow-lg"
                                : isAvailable
                                    ? "border-stone-200 bg-white hover:border-red-300"
                                    : "border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed"
                            }
            `}
                    >
                        {/* Selected indicator */}
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                            >
                                <span className="text-white text-xs">✓</span>
                            </motion.div>
                        )}

                        {/* Icon */}
                        <div className="text-3xl mb-2">{sizeInfo.icon}</div>

                        {/* Size label */}
                        <div className="font-bold text-stone-800">{size}</div>
                        <div className="text-xs text-stone-500 mb-2">{sizeInfo.label}</div>

                        {/* Price */}
                        <div className={`font-bold ${isSelected ? "text-red-600" : "text-stone-700"}`}>
                            {formatPrice(price)}
                        </div>

                        {/* Not available badge */}
                        {!isAvailable && (
                            <div className="absolute top-2 right-2 text-xs text-stone-400">
                                Hết hàng
                            </div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
