"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignPreviewProps {
    message: string;
    audienceCount: number;
    isSending: boolean;
    isSent: boolean;
    canSend: boolean;
    onSend: () => void;
    onReset: () => void;
}

export function CampaignPreview({
    message,
    audienceCount,
    isSending,
    isSent,
    canSend,
    onSend,
    onReset
}: CampaignPreviewProps) {
    return (
        <div className="sticky top-8">
            <div className="mockup-phone border-stone-800 border-[12px] rounded-[2.5rem] h-[600px] w-[300px] mx-auto bg-stone-900 shadow-2xl overflow-hidden relative">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 rounded-b-2xl z-20"></div>

                {/* Screen */}
                <div className="bg-white w-full h-full pt-12 px-4 relative">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-stone-100">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            SD
                        </div>
                        <div>
                            <p className="font-bold text-xs">SaDec Flower</p>
                            <p className="text-[10px] text-stone-400">Vừa xong</p>
                        </div>
                    </div>

                    {/* Message Bubble */}
                    {message ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-stone-100 p-3 rounded-2xl rounded-tl-none text-sm text-stone-800 shadow-sm"
                        >
                            {message}
                        </motion.div>
                    ) : (
                        <div className="text-center text-stone-300 mt-20 text-sm">
                            Xem trước tin nhắn
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="absolute bottom-8 left-4 right-4">
                        {isSent ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-green-500 text-white p-4 rounded-2xl text-center font-bold shadow-lg flex flex-col items-center gap-2"
                            >
                                <CheckCircle2 className="w-8 h-8" />
                                <div>
                                    <p>Đã Gửi Thành Công!</p>
                                    <p className="text-xs opacity-80">{audienceCount.toLocaleString()} tin nhắn đang được xử lý</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={onReset} className="text-white hover:bg-white/20 mt-2">
                                    Gửi Chiến Dịch Mới
                                </Button>
                            </motion.div>
                        ) : (
                            <Button
                                size="lg"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                                disabled={!canSend || isSending}
                                onClick={onSend}
                            >
                                {isSending ? (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                        Đang Gửi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Gửi Ngay ({audienceCount.toLocaleString()})
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
