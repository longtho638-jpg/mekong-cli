"use client";

import { useState } from "react";
import { SizeKey, calculatePrice } from "@/data/flowers";
import { ShoppingBag, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { trackEvent } from "@/lib/analytics";
import { OrderStep1Size } from "./order/OrderStep1Size";
import { OrderStep2Details } from "./order/OrderStep2Details";
import { OrderSuccess } from "./order/OrderSuccess";
import { Button } from "@/components/ui/button";

interface OrderFormProps {
    flowerId: number;
    flowerName: string;
    flowerImage: string;
    basePrice: number;
    availableSizes: SizeKey[];
}

export default function OrderForm({ flowerId, flowerName, flowerImage, basePrice, availableSizes }: OrderFormProps) {
    const [selectedSize, setSelectedSize] = useState<SizeKey>(availableSizes[0]);
    const [quantity, setQuantity] = useState(1);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [orderId, setOrderId] = useState("");

    const totalPrice = calculatePrice(basePrice, selectedSize) * quantity;

    const handleSubmit = async () => {
        if (!name || !phone || !address) return;

        setIsLoading(true);

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flowerId,
                    flowerName,
                    size: selectedSize,
                    quantity,
                    price: totalPrice,
                    customerName: name,
                    customerPhone: phone,
                    address,
                    notes
                })
            });

            const data = await response.json();

            if (data.success) {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#D0312D', '#EAB308', '#22C55E', '#EC4899']
                });

                await trackEvent("purchase", {
                    action: "order_placed",
                    order_id: data.orderId,
                    flower_id: flowerId,
                    amount: totalPrice,
                    quantity: quantity
                });

                setOrderId(data.orderId || "ORD-" + Date.now());
                setIsSuccess(true);
            }
        } catch (error) {
            console.error("Order error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <OrderSuccess
                orderId={orderId}
                flowerName={flowerName}
                flowerImage={flowerImage}
                selectedSize={selectedSize}
                quantity={quantity}
                totalPrice={totalPrice}
            />
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-white" />
                    <div>
                        <h2 className="text-lg font-bold text-white">Đặt Hàng Nhanh</h2>
                        <p className="text-red-100 text-sm">Giao tận nhà trong 24h</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Step 1: Size & Quantity */}
                <div>
                    <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Chọn Loại & Số Lượng
                    </h3>
                    <OrderStep1Size
                        selectedSize={selectedSize}
                        availableSizes={availableSizes}
                        basePrice={basePrice}
                        quantity={quantity}
                        totalPrice={totalPrice}
                        onSizeChange={setSelectedSize}
                        onQuantityChange={setQuantity}
                        onNext={() => { }}
                        singlePageMode={true} // Add this prop to hide "Next" button in component if possible, or just ignore
                    />
                </div>

                {/* Step 2: Information */}
                <div>
                    <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        Thông Tin Giao Hàng
                    </h3>
                    <OrderStep2Details
                        name={name}
                        phone={phone}
                        address={address}
                        notes={notes}
                        onNameChange={setName}
                        onPhoneChange={setPhone}
                        onAddressChange={setAddress}
                        onNotesChange={setNotes}
                        onBack={() => { }}
                        onNext={() => { }}
                        singlePageMode={true} // Add this prop to hide buttons
                    />
                </div>

                {/* Final Action */}
                <div className="pt-4 border-t border-stone-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-stone-500">Tổng thanh toán:</span>
                        <span className="text-xl font-bold text-red-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                        </span>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!name || !phone || !address || isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl text-lg shadow-lg shadow-red-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            "Hoàn Tất Đặt Hàng"
                        )}
                    </Button>
                    <p className="text-center text-xs text-stone-400 mt-3">
                        Thanh toán khi nhận hàng (COD) • Miễn phí ship Sa Đéc
                    </p>
                </div>
            </div>
        </div>
    );
}
