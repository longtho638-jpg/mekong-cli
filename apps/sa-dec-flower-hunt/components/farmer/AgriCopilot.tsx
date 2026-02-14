"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "model";
    text: string;
}

import { useFarmer } from "@/components/auth/FarmerAuthProvider";
import { supabase } from "@/lib/supabase";

export function AgriCopilot() {
    const { profile } = useFarmer();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", text: `Chào ${profile.farmerName || 'bạn'}! Hôm nay cần con hỗ trợ gì cho vườn không ạ? 🌻` }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Reset greeting when profile changes
    useEffect(() => {
        setMessages([
            { role: "model", text: `Chào ${profile.farmerName || 'bạn'}! Hôm nay cần con hỗ trợ gì cho vườn không ạ? 🌻` }
        ]);
    }, [profile.farmerName]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: "user", text: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            // Security: Attach Session Token
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const response = await fetch("/api/farmer/copilot", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: userMsg,
                    context: `User is ${profile.farmerName} (ID: ${profile.id}), a farmer in Sa Dec, Vietnam. Role: ${profile.role}.`
                }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: "model", text: data.text }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "model", text: "Xin lỗi bác, mạng hơi yếu. Bác hỏi lại giúp con nhé!" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 w-[350px] shadow-2xl"
                    >
                        <Card className="border-stone-200 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-white flex items-center gap-2 text-base">
                                    <Bot className="w-5 h-5" /> Agri-Copilot
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 bg-stone-50">
                                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                                    <div className="space-y-4">
                                        {messages.map((msg, idx) => (
                                            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-green-100 text-green-600' : 'bg-stone-200 text-stone-600'}`}>
                                                    {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                                </div>
                                                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'model' ? 'bg-white border border-stone-100 shadow-sm text-stone-800' : 'bg-stone-800 text-white'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600">
                                                    <Sparkles className="w-4 h-4 animate-spin" />
                                                </div>
                                                <div className="bg-white border border-stone-100 shadow-sm rounded-2xl p-3 text-sm text-stone-500 italic">
                                                    Đang suy nghĩ...
                                                </div>
                                            </div>
                                        )}
                                        <div ref={scrollRef} />
                                    </div>
                                </ScrollArea>
                                <div className="p-3 bg-white border-t border-stone-100 flex gap-2">
                                    <Input
                                        placeholder="Hỏi về giá cả, thời tiết..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        className="flex-1 focus-visible:ring-green-500"
                                    />
                                    <Button size="icon" className="bg-green-600 hover:bg-green-700" onClick={handleSend} disabled={isLoading}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                    size="lg"
                    className={`h-14 w-14 rounded-full shadow-xl ${isOpen ? 'bg-stone-800 hover:bg-stone-900' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                </Button>
            </motion.div>
        </div>
    );
}
