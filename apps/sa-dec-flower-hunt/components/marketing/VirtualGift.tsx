"use client";

import { useState } from "react";
import { useAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Share2, Sparkles } from "lucide-react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

const VIRTUAL_FLOWERS = [
    { id: 'lotus', name: 'Sen Hồng Sa Đéc', emoji: '🪷', meaning: 'Bình an & Thuần khiết' },
    { id: 'rose', name: 'Hồng Nhung', emoji: '🌹', meaning: 'Tình yêu nồng cháy' },
    { id: 'sunflower', name: 'Hướng Dương', emoji: '🌻', meaning: 'Thành công rực rỡ' },
    { id: 'apricot', name: 'Mai Vàng', emoji: '🌼', meaning: 'Phú quý tài lộc' },
];

export function VirtualGift() {
    const { track } = useAnalytics();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFlower, setSelectedFlower] = useState(VIRTUAL_FLOWERS[0]);
    const [recipient, setRecipient] = useState("");
    const [message, setMessage] = useState("");
    const [isSent, setIsSent] = useState(false);

    const handleSend = () => {
        if (!recipient || !message) return;

        track("share_virtual_gift", {
            flower: selectedFlower.id,
            recipient_length: recipient.length,
            message_length: message.length
        });

        setIsSent(true);

        // Simulate sharing
        setTimeout(() => {
            setIsSent(false);
            setIsOpen(false);
            setRecipient("");
            setMessage("");
        }, 5000);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="fixed bottom-6 right-6 z-50 rounded-full h-16 w-16 bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.8)] hover:scale-110 transition-all duration-300"
                    >
                        <Gift className="w-8 h-8 text-white animate-pulse" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel border-purple-500/30 bg-black/80 text-white max-w-md">
                    <AnimatePresence>
                        {isSent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center p-8 text-center space-y-4"
                            >
                                <Confetti numberOfPieces={200} recycle={false} />
                                <div className="text-6xl mb-4">{selectedFlower.emoji}</div>
                                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                                    Đã gửi thành công!
                                </h3>
                                <p className="text-stone-300">
                                    Món quà tinh thần đã được gửi đến <span className="text-white font-bold">{recipient}</span>.
                                </p>
                                <p className="text-xs text-stone-500 italic mt-6">
                                    "Trao đi yêu thương, nhận lại nụ cười."
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                <CardHeader className="p-0">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-300">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                        Gửi Hoà Bình An (Virtual Gift)
                                    </CardTitle>
                                    <p className="text-sm text-stone-400">
                                        Gửi tặng người thân một đóa hoa 4.0 kèm lời chúc Tết.
                                    </p>
                                </CardHeader>

                                <div className="space-y-4">
                                    {/* Flower Selection */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {VIRTUAL_FLOWERS.map((flower) => (
                                            <button
                                                key={flower.id}
                                                onClick={() => setSelectedFlower(flower)}
                                                className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedFlower.id === flower.id
                                                        ? 'bg-purple-600/30 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                                        : 'bg-stone-800/50 hover:bg-stone-700'
                                                    }`}
                                            >
                                                <span className="text-2xl filter drop-shadow hover:scale-125 transition-transform duration-300">{flower.emoji}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-center text-sm font-medium text-pink-400">
                                        {selectedFlower.name} - {selectedFlower.meaning}
                                    </div>

                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Tên người nhận (VD: Mẹ yêu, Crush...)"
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            className="bg-stone-900/50 border-stone-700 text-white placeholder:text-stone-500"
                                        />
                                        <Textarea
                                            placeholder="Lời chúc (VD: Năm mới bình an, luôn xinh đẹp như hoa...)"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="bg-stone-900/50 border-stone-700 text-white placeholder:text-stone-500 min-h-[100px]"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSend}
                                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-6 text-lg shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                                    >
                                        <Share2 className="w-5 h-5 mr-2" /> Gửi Ngay
                                    </Button>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </>
    );
}
