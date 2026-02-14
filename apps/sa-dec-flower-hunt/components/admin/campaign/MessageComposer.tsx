"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
    "🌸 Cúc Mâm Xôi đang giảm 50%! Chỉ còn 150k/chậu. Đặt ngay: [Link]",
    "🚚 Freeship cho đơn hàng hôm nay! Nhập mã TET2026.",
    "🔥 Chỉ còn 20 chậu Hồng Cổ Sa Đéc. Nhanh tay kẻo lỡ!"
];

interface MessageComposerProps {
    message: string;
    isActive: boolean;
    onChange: (message: string) => void;
    onNext: () => void;
}

export function MessageComposer({ message, isActive, onChange, onNext }: MessageComposerProps) {
    return (
        <Card className={`transition-all duration-300 ${isActive ? 'ring-2 ring-stone-900 shadow-lg' : 'opacity-60'}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Soạn Tin Nhắn
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">Mẫu Tin Nhanh</label>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATES.map((temp, i) => (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-stone-200 py-1 px-3"
                                    onClick={() => onChange(temp)}
                                >
                                    Mẫu {i + 1}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <Textarea
                        value={message}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Nhập nội dung tin nhắn..."
                        className="min-h-[120px] text-lg"
                    />
                    <div className="flex justify-between items-center text-xs text-stone-500">
                        <span>{message.length} ký tự</span>
                        <span>1 tin nhắn = 160 ký tự</span>
                    </div>
                    {isActive && message.length > 0 && (
                        <Button onClick={onNext} className="w-full bg-stone-900 text-white hover:bg-stone-800">
                            Tiếp Tục: Xem Trước
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
