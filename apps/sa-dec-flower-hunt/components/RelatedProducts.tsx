"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/data/flowers";

const RELATED_PRODUCTS = [
    {
        id: "cuc-mam-xoi",
        name: "Cúc Mâm Xôi Sa Đéc",
        price: 180000,
        image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400",
        tag: "Best Seller"
    },
    {
        id: "hong-sa-dec",
        name: "Hồng Sa Đéc Truyền Thống",
        price: 120000,
        image: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=400",
        tag: "Hương Thơm"
    },
    {
        id: "mai-vang",
        name: "Mai Vàng Tứ Quý",
        price: 450000,
        image: "https://images.unsplash.com/photo-1548690321-e3b507d8c110?w=400",
        tag: "Cao Cấp"
    }
];

export function RelatedProducts() {
    return (
        <div className="space-y-4 py-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900">Có thể bạn sẽ thích 🌸</h3>
                <Link href="/" className="text-sm font-medium text-rose-600 hover:text-rose-700">
                    Xem tất cả &rarr;
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {RELATED_PRODUCTS.map((product) => (
                    <Link href={`/flower/${product.id}`} key={product.id}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-stone-100 overflow-hidden group">
                            <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <Badge className="absolute top-2 right-2 bg-white/90 text-stone-900 shadow-sm backdrop-blur-sm">
                                    {product.tag}
                                </Badge>
                            </div>
                            <CardContent className="p-3">
                                <h4 className="font-semibold text-stone-900 truncate">{product.name}</h4>
                                <p className="text-rose-600 font-bold mt-1">{formatPrice(product.price)}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
