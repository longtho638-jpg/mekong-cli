"use client";

// ============================================================================
// AI COPILOT - Smart FAQ Auto-Reply
// ============================================================================
// 80% auto-reply common questions, 20% escalate to human
// Vision: agrios.tech intelligent farming assistant
// ============================================================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle, Send, Bot, User, X, Sparkles,
    HelpCircle, Phone, Mail, ChevronDown, Loader2
} from "lucide-react";

// FAQ Knowledge Base - 80% of common questions
const FAQ_DATABASE = [
    {
        keywords: ["giá", "bao nhiêu", "giá cả", "chi phí", "phí"],
        answer: "🌸 **Miễn phí hoàn toàn cho nông dân!**\n\nVới người mua:\n- Hoa: Giá từ nhà vườn + 5% phí platform\n- Vận chuyển: Tính theo km\n\nXem chi tiết: [Bảng giá](/pricing)",
        category: "pricing"
    },
    {
        keywords: ["đăng ký", "tạo tài khoản", "đăng kí", "sign up", "register"],
        answer: "📝 **Đăng ký siêu đơn giản:**\n\n1. Bấm [Đăng ký](/register)\n2. Nhập SĐT + Mật khẩu\n3. Xác minh OTP\n4. Hoàn tất!\n\n⏱️ Chỉ mất 2 phút!",
        category: "onboarding"
    },
    {
        keywords: ["bán hoa", "đăng sản phẩm", "upload", "tải ảnh", "đăng bán"],
        answer: "📸 **3 bước đăng bán hoa:**\n\n1. Vào [Farmer Dashboard](/farmer)\n2. Bấm '+ Thêm sản phẩm'\n3. Chụp ảnh → Nhập giá → Đăng!\n\n💡 Tip: Ảnh đẹp = bán nhanh hơn 3x",
        category: "selling"
    },
    {
        keywords: ["thanh toán", "payment", "trả tiền", "chuyển khoản", "ví"],
        answer: "💳 **Thanh toán linh hoạt:**\n\n- 🏦 Chuyển khoản ngân hàng\n- 💵 COD (nhận hàng trả tiền)\n- 📱 Ví điện tử (đang phát triển)\n\n💰 Tiền về ví trong 24h sau hoàn tất đơn!",
        category: "payment"
    },
    {
        keywords: ["giao hàng", "vận chuyển", "ship", "delivery", "giao"],
        answer: "🚚 **Giao hàng cold-chain đảm bảo:**\n\n- 🌡️ Xe lạnh 18-22°C\n- ⏱️ Giao trong 24-48h\n- 📍 Toàn quốc\n\n🔒 Hoàn tiền 100% nếu hoa héo!",
        category: "shipping"
    },
    {
        keywords: ["đơn hàng", "order", "theo dõi", "tracking", "đơn"],
        answer: "📦 **Theo dõi đơn hàng:**\n\n1. Vào [Đơn hàng của tôi](/orders)\n2. Hoặc scan QR trên hóa đơn\n3. Xem lịch sử vận chuyển realtime\n\n🔔 Nhận thông báo tự động mỗi bước!",
        category: "orders"
    },
    {
        keywords: ["liên hệ", "hotline", "hỗ trợ", "support", "contact"],
        answer: "📞 **Hỗ trợ 24/7:**\n\n- 📱 Hotline: 1900-AGRIOS\n- 💬 Zalo: @agrios.tech\n- ✉️ Email: support@agrios.tech\n\n⚡ Phản hồi trong 5 phút!",
        category: "support"
    },
    {
        keywords: ["tết", "lễ hội", "festival", "hoa tết", "xuân"],
        answer: "🎊 **Lễ hội Hoa Xuân Sa Đéc:**\n\n📅 25/01 - 10/02/2025\n📍 Làng hoa Sa Đéc\n\n🎁 Ưu đãi đặc biệt:\n- Giảm 20% vận chuyển\n- Loot box may mắn\n- QR Hunt săn quà\n\n[Xem chi tiết](/festival)",
        category: "festival"
    },
    {
        keywords: ["hồng", "cúc", "mai", "lan", "hướng dương", "loại hoa"],
        answer: "🌺 **Hoa Sa Đéc nổi tiếng:**\n\n- 🌹 Hồng Sa Đéc - Đặc sản\n- 🌼 Cúc Mâm Xôi - Best seller Tết\n- 🌸 Mai Vàng - Phú quý\n- 🪻 Lan Hồ Điệp - Sang trọng\n\n[Khám phá ngay](/shop)",
        category: "products"
    },
    {
        keywords: ["agrios", "về chúng tôi", "là gì", "giới thiệu"],
        answer: "🌱 **AGRIOS = Agriculture + OS**\n\nNền tảng công nghệ nông nghiệp thông minh:\n- 🌸 Kết nối nông dân → khách hàng\n- 🚚 Cold-chain logistics\n- 🏦 Fintech cho nông nghiệp\n- 🤖 AI trợ lý canh tác\n\n🎯 Sứ mệnh: Số hóa làng hoa Sa Đéc",
        category: "about"
    }
];

// Find best matching FAQ
function findAnswer(query: string): { answer: string; confidence: number } | null {
    const queryLower = query.toLowerCase();

    let bestMatch: { answer: string; confidence: number } | null = null;
    let maxScore = 0;

    for (const faq of FAQ_DATABASE) {
        let score = 0;
        for (const keyword of faq.keywords) {
            if (queryLower.includes(keyword.toLowerCase())) {
                score += 1;
            }
        }

        if (score > maxScore) {
            maxScore = score;
            const confidence = Math.min(score / 2, 1); // 2 keywords = 100% confidence
            bestMatch = { answer: faq.answer, confidence };
        }
    }

    return maxScore > 0 ? bestMatch : null;
}

// Message type
interface Message {
    id: string;
    role: "user" | "bot" | "system";
    content: string;
    timestamp: Date;
}

// Chat bubble component
// 🔒 SECURITY: Sanitize content to prevent XSS attacks
function escapeHtml(text: string): string {
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
        div.textContent = text;
        return div.innerHTML;
    }
    // Server-side fallback
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatBotContent(content: string): string {
    // 🔒 First escape the content to prevent XSS
    const escaped = escapeHtml(content);
    // Then apply safe formatting (only on escaped content)
    return escaped
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((\/[a-zA-Z0-9\-\/]*)\)/g, '<a href="$2" class="text-emerald-400 underline">$1</a>');  // 🔒 Only allow internal links
}

function ChatBubble({ message }: { message: Message }) {
    const isBot = message.role === "bot";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex gap-2 ${isBot ? "" : "flex-row-reverse"}`}
        >
            <div className={`
        w-8 h-8 rounded-full flex items-center justify-center shrink-0
        ${isBot ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-stone-700"}
      `}>
                {isBot ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-stone-300" />}
            </div>

            <div className={`
        max-w-[80%] p-3 rounded-2xl
        ${isBot
                    ? "bg-stone-800 text-stone-100 rounded-tl-none"
                    : "bg-emerald-600 text-white rounded-tr-none"
                }
      `}>
                <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                        __html: isBot
                            ? formatBotContent(message.content)  // 🔒 Bot messages: sanitize + format
                            : escapeHtml(message.content)        // 🔒 User messages: escape only
                    }}
                />
                <div className="text-[10px] text-stone-500 mt-1">
                    {message.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </motion.div>
    );
}

// Main Copilot Component
export function AICopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "bot",
            content: "👋 Xin chào! Tôi là **AGRIOS AI** - trợ lý thông minh của bạn.\n\nHãy hỏi tôi về:\n- 💰 Giá cả & thanh toán\n- 🚚 Giao hàng\n- 📝 Đăng ký bán hoa\n- 🎊 Lễ hội Hoa Xuân\n\nHoặc gõ câu hỏi bất kỳ!",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle send message
    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        // Simulate AI thinking
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

        // Find answer
        const result = findAnswer(userMessage.content);

        let botResponse: Message;

        if (result && result.confidence >= 0.5) {
            // Auto-reply (80% of cases)
            botResponse = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: result.answer,
                timestamp: new Date()
            };
        } else {
            // Escalate to human (20% of cases)
            botResponse = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: "🤔 Câu hỏi này cần chuyên gia hỗ trợ!\n\n**Liên hệ ngay:**\n- 📱 Hotline: 1900-AGRIOS\n- 💬 Zalo: @agrios.tech\n\nHoặc để lại SĐT, chúng tôi sẽ gọi lại trong 5 phút! 📞",
                timestamp: new Date()
            };
        }

        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
    };

    // Quick actions
    const quickActions = [
        { label: "Giá cả", query: "Giá cả thế nào?" },
        { label: "Đăng ký", query: "Đăng ký bán hoa?" },
        { label: "Giao hàng", query: "Giao hàng như thế nào?" },
        { label: "Lễ hội", query: "Lễ hội hoa khi nào?" },
    ];

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`
          fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl
          bg-gradient-to-br from-emerald-500 to-green-600
          flex items-center justify-center
          ${isOpen ? "hidden" : ""}
        `}
            >
                <MessageCircle className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    1
                </span>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 w-[360px] h-[520px] bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">AGRIOS AI</h3>
                                    <div className="flex items-center gap-1 text-emerald-200 text-xs">
                                        <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                                        Online • 80% auto-reply
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => (
                                <ChatBubble key={msg.id} message={msg} />
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-2"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                    <div className="bg-stone-800 px-4 py-2 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 border-t border-stone-800 flex gap-2 overflow-x-auto">
                            {quickActions.map(action => (
                                <button
                                    key={action.label}
                                    onClick={() => {
                                        setInput(action.query);
                                        handleSend();
                                    }}
                                    className="shrink-0 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs px-3 py-1.5 rounded-full transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-stone-800">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Nhập câu hỏi..."
                                    className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-2 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-700 rounded-xl flex items-center justify-center transition-colors"
                                >
                                    <Send className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default AICopilot;
