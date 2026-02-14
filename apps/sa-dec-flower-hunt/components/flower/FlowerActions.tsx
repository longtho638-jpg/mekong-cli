"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HypnoticButton } from "@/components/ui/hypnotic-button";
import OrderForm from "@/components/OrderForm";
import confetti from "canvas-confetti";
import { SizeKey } from "@/data/flowers";

interface FlowerActionsProps {
    flowerId: number;
    flowerName: string;
    flowerImage: string;
    basePrice: number;
    sizesAvailable: SizeKey[];
}

export function FlowerActions({
    flowerId,
    flowerName,
    flowerImage,
    basePrice,
    sizesAvailable
}: FlowerActionsProps) {
    const [showOrder, setShowOrder] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const triggerConfetti = () => {
        if (showConfetti) return;
        setShowConfetti(true);

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D0312D', '#EAB308', '#22C55E']
        });

        const scanned = JSON.parse(localStorage.getItem("sadec_scanned") || "[]");
        if (!scanned.includes(flowerId)) {
            scanned.push(flowerId);
            localStorage.setItem("sadec_scanned", JSON.stringify(scanned));
        }
    };

    return (
        <>
            {/* Order Section */}
            {!showOrder ? (
                <HypnoticButton
                    className="w-full mb-4"
                    onClick={() => setShowOrder(true)}
                >
                    <div className="flex items-center gap-2 text-lg font-bold">
                        <ShoppingCart className="w-5 h-5" />
                        Đặt Hàng Ngay
                    </div>
                </HypnoticButton>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-8"
                >
                    <OrderForm
                        flowerId={flowerId}
                        flowerName={flowerName}
                        flowerImage={flowerImage}
                        basePrice={basePrice}
                        availableSizes={sizesAvailable}
                    />
                </motion.div>
            )}

            {/* Gamification Button */}
            <Button
                variant={showConfetti ? "outline" : "secondary"}
                className={`w-full h-12 rounded-xl font-bold ${showConfetti
                    ? "border-green-500 text-green-600 bg-green-50"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                onClick={triggerConfetti}
                disabled={showConfetti}
            >
                {showConfetti ? (
                    <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Đã Quét Vườn Này
                    </>
                ) : (
                    <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Tôi Đang Ở Vườn Này
                    </>
                )}
            </Button>
        </>
    );
}
