"use client";

import { motion } from "framer-motion";
import { User, Phone, FileText } from "lucide-react";
import { SmartAddressInput } from "../SmartAddressInput";
import { Button } from "@/components/ui/button";

interface OrderStep2DetailsProps {
    name: string;
    phone: string;
    address: string;
    notes: string;
    onNameChange: (value: string) => void;
    onPhoneChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onBack: () => void;
    onNext: () => void;
    singlePageMode?: boolean;
}

export function OrderStep2Details({
    name,
    phone,
    address,
    notes,
    onNameChange,
    onPhoneChange,
    onAddressChange,
    onNotesChange,
    onBack,
    onNext,
    singlePageMode = false
}: OrderStep2DetailsProps) {
    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <h3 className="font-bold text-stone-800 mb-4">Thông Tin Giao Hàng</h3>

            <div className="space-y-4">
                {/* Name */}
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Tên người nhận"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                </div>

                {/* Phone */}
                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        placeholder="Số điện thoại"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                </div>

                {/* Address */}
                <div className="relative">
                    <SmartAddressInput
                        value={address}
                        onChange={onAddressChange}
                    />
                </div>

                {/* Notes */}
                <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-stone-400" />
                    <textarea
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Ghi chú (không bắt buộc)"
                        rows={2}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none"
                    />
                </div>
            </div>

            {!singlePageMode && (
                <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={onBack} className="flex-1 rounded-xl">
                        Quay lại
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!name || !phone || !address}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    >
                        Tiếp tục
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
