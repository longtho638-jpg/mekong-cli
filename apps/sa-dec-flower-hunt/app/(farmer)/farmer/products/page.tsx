"use client";

import { useFarmer } from "@/components/auth/FarmerAuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Sparkles, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const MOCK_PRODUCTS = [
    { id: 101, name: "Cúc Mâm Xôi (Size L)", price: 150000, stock: 450, image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400" },
    { id: 102, name: "Cúc Mâm Xôi (Size XL)", price: 250000, stock: 120, image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400" },
    { id: 103, name: "Combo 3 Chậu (Quà biếu)", price: 420000, stock: 50, image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400" },
];

export default function MyGardenPage() {
    const { profile } = useFarmer();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAIWrite = async () => {
        setIsGenerating(true);
        toast.info("Gemini đang quan sát ảnh hoa...", { duration: 1500 });

        try {
            // DEMO: Fetch a sample image and convert to base64 to simulate user upload
            // In real app, this comes from <input type="file" />
            const response = await fetch("https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=400");
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = async () => {
                const base64data = (reader.result as string)?.split(',')[1];

                try {
                    const apiRes = await fetch('/api/farmer/ai-listing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64data, mimeType: 'image/jpeg' })
                    });

                    const data = await apiRes.json();

                    if (data.error) throw new Error(data.message);

                    toast.success("Đã tạo mô tả sản phẩm mới! ✨", {
                        description: `${data.name}: ${data.description}`
                    });

                    // Ideally, we would add this new product to the list or open a modal to edit.
                    // For this demo, we can alert or log it.
                    if (process.env.NODE_ENV !== 'production') {
                        console.log("AI Data received for auto-fill");
                    }

                } catch (err) {
                    console.error(err);
                    toast.error("Lỗi kết nối với Gemini. Thử lại sau!");
                } finally {
                    setIsGenerating(false);
                }
            };

            reader.readAsDataURL(blob);

        } catch (e) {
            console.error(e);
            setIsGenerating(false);
            toast.error("Không tải được ảnh mẫu.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Vườn của tôi 🌻</h1>
                    <p className="text-stone-500">Quản lý sản phẩm và kho hàng</p>
                </div>
                <Button className="bg-stone-900 text-white shadow-lg gap-2">
                    <Plus className="w-4 h-4" /> Thêm hoa mới
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* New Listing Card (AI Featured) */}
                <Card className="border-2 border-dashed border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center p-6 text-center hover:bg-stone-50 transition-colors group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="font-bold text-stone-700">Đăng bán hoa mới?</h3>
                    <p className="text-sm text-stone-500 mt-1 mb-4">Chụp ảnh và để AI viết mô tả cho bạn</p>
                    <Button
                        variant="outline"
                        className="gap-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 text-amber-700"
                        onClick={handleAIWrite}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-spin" /> Đang viết...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" /> Dùng AI Listing
                            </>
                        )}
                    </Button>
                </Card>

                {MOCK_PRODUCTS.map((prod) => (
                    <motion.div key={prod.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="overflow-hidden border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video relative bg-stone-100">
                                <Image src={prod.image} alt={prod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                <div className="absolute top-2 right-2">
                                    <Badge className="bg-white/90 text-stone-800 hover:bg-white backdrop-blur-sm">
                                        Kho: {prod.stock}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-bold text-stone-900">{prod.name}</h3>
                                <p className="text-amber-600 font-bold mt-1">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                                </p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    <Edit2 className="w-4 h-4 mr-2" /> Sửa
                                </Button>
                                <Button variant="secondary" size="sm" className="bg-stone-100 hover:bg-stone-200">
                                    Ẩn
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
