"use client";

// ============================================================================
// FMCG CATALOG - Deep Processing Products
// ============================================================================
// Rose Water, Lotus Tea, Dried Flowers - Year-round revenue
// Based on IPO Architect Blueprint - Section 4.2 Chiến lược 2
// ============================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Leaf, Droplets, Coffee, Star, ShoppingCart,
    Heart, Filter, ChevronDown, Check, Sparkles, Gift
} from "lucide-react";
import Link from "next/link";

// Product categories
const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: '🌸' },
    { id: 'skincare', name: 'Chăm sóc da', icon: '✨' },
    { id: 'tea', name: 'Trà hoa', icon: '🍵' },
    { id: 'decor', name: 'Trang trí', icon: '🎨' },
    { id: 'gift', name: 'Quà tặng', icon: '🎁' }
];

// FMCG Products from Sa Đéc flowers
const PRODUCTS = [
    {
        id: 'rose-water-100',
        name: 'Nước Hoa Hồng Sa Đéc',
        subtitle: 'Pure Rose Water 100ml',
        category: 'skincare',
        price: 189000,
        originalPrice: 250000,
        rating: 4.9,
        reviews: 128,
        image: '/products/rose-water.jpg',
        emoji: '🌹',
        color: 'from-rose-500 to-pink-600',
        badge: 'Best Seller',
        description: 'Nước chưng cất 100% từ hoa hồng Sa Đéc, không hóa chất. Dùng để dưỡng da, làm toner, hoặc pha chế đồ uống.',
        benefits: ['Cấp ẩm tức thì', 'Thu nhỏ lỗ chân lông', 'Hương thơm tự nhiên'],
        origin: 'Vườn Hồng Tư Tôn - Sa Đéc'
    },
    {
        id: 'lotus-tea',
        name: 'Trà Sen Đồng Tháp',
        subtitle: 'Lotus Tea Premium 100g',
        category: 'tea',
        price: 159000,
        originalPrice: 200000,
        rating: 4.8,
        reviews: 89,
        image: '/products/lotus-tea.jpg',
        emoji: '🪷',
        color: 'from-pink-500 to-rose-600',
        badge: 'Organic',
        description: 'Trà sen ướp hương tự nhiên từ sen Tháp Mười. Giúp thanh nhiệt, an thần, ngủ ngon.',
        benefits: ['An thần', 'Thanh nhiệt', 'Giảm stress'],
        origin: 'Tháp Mười - Đồng Tháp'
    },
    {
        id: 'dried-roses',
        name: 'Hoa Hồng Sấy Khô',
        subtitle: 'Dried Rose Petals 50g',
        category: 'decor',
        price: 99000,
        originalPrice: 150000,
        rating: 4.7,
        reviews: 56,
        image: '/products/dried-roses.jpg',
        emoji: '🥀',
        color: 'from-red-500 to-rose-600',
        badge: null,
        description: 'Cánh hồng sấy khô tự nhiên, giữ nguyên hương thơm. Dùng trang trí, làm nến thơm, hoặc pha trà.',
        benefits: ['100% tự nhiên', 'Hương thơm lâu', 'Đa công dụng'],
        origin: 'Vườn Hồng Sa Đéc'
    },
    {
        id: 'rose-essential',
        name: 'Tinh Dầu Hoa Hồng',
        subtitle: 'Rose Essential Oil 10ml',
        category: 'skincare',
        price: 299000,
        originalPrice: 400000,
        rating: 4.9,
        reviews: 45,
        image: '/products/rose-oil.jpg',
        emoji: '💧',
        color: 'from-amber-500 to-rose-500',
        badge: 'Premium',
        description: 'Tinh dầu nguyên chất chiết xuất từ hoa hồng. 1000 bông hồng cho 1ml tinh dầu.',
        benefits: ['Dưỡng ẩm sâu', 'Chống lão hóa', 'Thư giãn'],
        origin: 'Vườn Hồng Sa Đéc'
    },
    {
        id: 'chrysanthemum-tea',
        name: 'Trà Cúc Mâm Xôi',
        subtitle: 'Chrysanthemum Tea 100g',
        category: 'tea',
        price: 129000,
        originalPrice: 180000,
        rating: 4.6,
        reviews: 72,
        image: '/products/cuc-tea.jpg',
        emoji: '🌼',
        color: 'from-amber-400 to-yellow-500',
        badge: null,
        description: 'Trà hoa cúc mâm xôi sấy khô, thanh nhiệt, giải độc. Uống nóng hoặc lạnh đều ngon.',
        benefits: ['Thanh nhiệt', 'Sáng mắt', 'Detox'],
        origin: 'Làng Hoa Sa Đéc'
    },
    {
        id: 'gift-box-tet',
        name: 'Gift Box Xuân Sa Đéc',
        subtitle: 'Tết Gift Set',
        category: 'gift',
        price: 599000,
        originalPrice: 800000,
        rating: 5.0,
        reviews: 34,
        image: '/products/gift-box.jpg',
        emoji: '🎁',
        color: 'from-red-500 to-amber-500',
        badge: 'Limited',
        description: 'Hộp quà Tết cao cấp: 1 Nước hoa hồng + 1 Trà sen + 1 Hoa khô + Thiệp chúc.',
        benefits: ['Combo tiết kiệm 25%', 'Đóng gói sang trọng', 'Giao tận nơi'],
        origin: 'Sa Đéc - Đồng Tháp'
    },
    {
        id: 'potpourri',
        name: 'Hỗn Hợp Hoa Thơm',
        subtitle: 'Potpourri Mix 100g',
        category: 'decor',
        price: 149000,
        originalPrice: 200000,
        rating: 4.5,
        reviews: 28,
        image: '/products/potpourri.jpg',
        emoji: '🌺',
        color: 'from-purple-500 to-pink-500',
        badge: null,
        description: 'Hỗn hợp hoa khô: Hồng, cúc, sen, lavender. Để trong phòng cho hương thơm tự nhiên.',
        benefits: ['Khử mùi', 'Trang trí đẹp', '3-6 tháng'],
        origin: 'Sa Đéc'
    },
    {
        id: 'face-mist',
        name: 'Xịt Khoáng Hoa Hồng',
        subtitle: 'Rose Face Mist 150ml',
        category: 'skincare',
        price: 219000,
        originalPrice: 280000,
        rating: 4.8,
        reviews: 67,
        image: '/products/face-mist.jpg',
        emoji: '💨',
        color: 'from-rose-400 to-pink-500',
        badge: 'New',
        description: 'Xịt khoáng dưỡng ẩm với nước hoa hồng và vitamin E. Dùng mọi lúc mọi nơi.',
        benefits: ['Cấp ẩm nhanh', 'Set makeup', 'Làm dịu da'],
        origin: 'Vườn Hồng Sa Đéc'
    }
];

// Product card
function ProductCard({ product }: { product: typeof PRODUCTS[0] }) {
    const [isHovered, setIsHovered] = useState(false);
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);

    return (
        <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -5 }}
            className="bg-stone-900/50 border border-stone-800 rounded-2xl overflow-hidden group hover:border-emerald-500/30 transition-all"
        >
            {/* Image */}
            <div className={`relative h-48 bg-gradient-to-br ${product.color} p-6`}>
                <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-20">
                    {product.emoji}
                </div>
                <div className="relative z-10 text-center">
                    <span className="text-6xl">{product.emoji}</span>
                </div>

                {/* Badge */}
                {product.badge && (
                    <div className="absolute top-3 left-3 bg-white/90 text-stone-800 text-xs font-bold px-2 py-1 rounded-full">
                        {product.badge}
                    </div>
                )}

                {/* Discount */}
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -{discount}%
                </div>

                {/* Quick add */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-stone-800 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Thêm vào giỏ
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-white font-bold">{product.name}</h3>
                        <p className="text-stone-500 text-sm">{product.subtitle}</p>
                    </div>
                    <button className="text-stone-500 hover:text-red-400 transition-colors">
                        <Heart className="w-5 h-5" />
                    </button>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-white text-sm font-medium">{product.rating}</span>
                    </div>
                    <span className="text-stone-500 text-sm">({product.reviews} reviews)</span>
                </div>

                {/* Origin */}
                <p className="text-stone-500 text-xs mb-3 flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    {product.origin}
                </p>

                {/* Price */}
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-emerald-400 text-xl font-bold">
                            {(product.price / 1000).toFixed(0)}k
                        </span>
                        <span className="text-stone-500 line-through text-sm ml-2">
                            {(product.originalPrice / 1000).toFixed(0)}k
                        </span>
                    </div>
                    <Link
                        href={`/shop/product/${product.id}`}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                    >
                        Chi tiết →
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

import { withI18n, WithI18nProps } from "@/lib/withI18n";

// ... (imports remain same)

// ... (CATEGORIES and PRODUCTS arrays remain same for now, or minimal update if simple)

// Main page
function FMCGPage({ texts }: WithI18nProps) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('popular');

    const filteredProducts = PRODUCTS.filter(p =>
        selectedCategory === 'all' || p.category === selectedCategory
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
            {/* Hero */}
            <section className="relative overflow-hidden py-16 px-4">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-amber-500/10" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        {texts.badge}
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                        🌹 {texts.title} <span className="text-rose-400">Hoa Sa Đéc</span>
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-400 text-lg max-w-2xl mx-auto"
                    >
                        {texts.subtitle}
                    </motion.p>
                </div>
            </section>

            {/* Filters */}
            <section className="px-4 pb-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${selectedCategory === cat.id
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                        }
                  `}
                                >
                                    {cat.icon} {
                                        cat.id === 'all' ? texts["filter.all"] :
                                            cat.id === 'skincare' ? texts["filter.skincare"] :
                                                cat.id === 'tea' ? texts["filter.tea"] :
                                                    cat.id === 'decor' ? texts["filter.decor"] :
                                                        cat.id === 'gift' ? texts["filter.gift"] : cat.name
                                    }
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-stone-500" />
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
                            >
                                <option value="popular">{texts["sort.popular"]}</option>
                                <option value="price-low">{texts["sort.price_low"]}</option>
                                <option value="price-high">{texts["sort.price_high"]}</option>
                                <option value="rating">{texts["sort.rating"]}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products grid */}
            <section className="px-4 pb-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-stone-400 text-sm mb-6">
                        {texts["products.count"]} {filteredProducts.length}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="px-4 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl p-8 text-center">
                        <Gift className="w-12 h-12 text-white/80 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {texts["banner.title"]}
                        </h2>
                        <p className="text-rose-100 mb-6">
                            {texts["banner.subtitle"]}
                        </p>
                        <Link
                            href="/shop/fmcg/gift-box-tet"
                            className="inline-flex items-center gap-2 bg-white text-rose-600 px-8 py-3 rounded-xl font-bold hover:bg-rose-50 transition-colors"
                        >
                            {texts["banner.cta"]} <ShoppingCart className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default withI18n(FMCGPage, "shop_fmcg");
