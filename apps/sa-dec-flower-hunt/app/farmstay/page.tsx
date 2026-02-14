"use client";

// ============================================================================
// FARMSTAY BOOKING - Off-Season Tourism
// ============================================================================
// Based on IPO Architect Blueprint - Section 4.2 Chiến lược 3
// Du lịch Farmstay & "Digital Detox" - Year-round revenue
// ============================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home, MapPin, Star, Users, Wifi, Coffee, Utensils,
    Calendar, ChevronLeft, ChevronRight, Heart, Camera,
    Waves, TreePine, Sun, Moon, Check, Phone
} from "lucide-react";

// Farmstay listings
const FARMSTAYS = [
    {
        id: 'bamboo-house',
        name: 'Bamboo House Sa Đéc',
        type: 'Nhà Sàn Tre',
        location: 'Tân Quy Đông, Sa Đéc',
        rating: 4.9,
        reviews: 89,
        price: 650000,
        originalPrice: 800000,
        maxGuests: 4,
        bedrooms: 2,
        images: ['/farmstay/bamboo-1.jpg', '/farmstay/bamboo-2.jpg'],
        emoji: '🎋',
        color: 'from-emerald-500 to-green-600',
        badge: 'Top Pick',
        description: 'Nhà sàn tre truyền thống bên bờ sông, view vườn hoa tuyệt đẹp. Trải nghiệm sống chậm authentic.',
        amenities: ['Wifi miễn phí', 'Bữa sáng', 'Xe đạp', 'Thuyền kayak', 'BBQ', 'Vườn hoa'],
        highlights: [
            'View sông tuyệt đẹp',
            'Vườn hoa 1000m²',
            'Đầu bếp địa phương',
            'Yoga sáng miễn phí'
        ],
        host: {
            name: 'Cô Tư Hồng',
            avatar: '👩‍🌾',
            experience: '15 năm trồng hoa'
        }
    },
    {
        id: 'lotus-villa',
        name: 'Lotus Villa Đồng Tháp',
        type: 'Biệt Thự Sen',
        location: 'Tháp Mười, Đồng Tháp',
        rating: 4.8,
        reviews: 56,
        price: 1200000,
        originalPrice: 1500000,
        maxGuests: 6,
        bedrooms: 3,
        images: ['/farmstay/lotus-1.jpg', '/farmstay/lotus-2.jpg'],
        emoji: '🪷',
        color: 'from-pink-500 to-rose-600',
        badge: 'Luxury',
        description: 'Biệt thự giữa đầm sen Tháp Mười. Hồ bơi riêng, spa sen, ẩm thực organic.',
        amenities: ['Hồ bơi', 'Spa', 'Wifi', 'Bếp đầy đủ', 'BBQ', 'Đầm sen'],
        highlights: [
            'Hồ bơi riêng',
            'Spa với tinh dầu sen',
            'Tour đầm sen miễn phí',
            'Bữa tối 5 món organic'
        ],
        host: {
            name: 'Anh Năm Sen',
            avatar: '👨‍🌾',
            experience: '20 năm canh tác sen'
        }
    },
    {
        id: 'flower-cottage',
        name: 'Flower Cottage',
        type: 'Nhà Vườn Hoa',
        location: 'Sa Nhiên, Sa Đéc',
        rating: 4.7,
        reviews: 42,
        price: 450000,
        originalPrice: 600000,
        maxGuests: 2,
        bedrooms: 1,
        images: ['/farmstay/cottage-1.jpg', '/farmstay/cottage-2.jpg'],
        emoji: '🌸',
        color: 'from-rose-400 to-pink-500',
        badge: 'Romantic',
        description: 'Cottage lãng mạn cho cặp đôi, nằm giữa vườn hồng Sa Đéc. Perfect cho honeymoon.',
        amenities: ['Wifi', 'Bữa sáng', 'Jacuzzi', 'Wine', 'Trà hoa', 'Xe đạp'],
        highlights: [
            'View vườn hồng 360°',
            'Jacuzzi ngoài trời',
            'Champagne chào đón',
            'Ảnh cưới miễn phí'
        ],
        host: {
            name: 'Chị Ba Hồng',
            avatar: '👩‍🌾',
            experience: '10 năm homestay'
        }
    },
    {
        id: 'riverside-bungalow',
        name: 'Riverside Bungalow',
        type: 'Bungalow Ven Sông',
        location: 'Cù lao Tân Quy, Sa Đéc',
        rating: 4.6,
        reviews: 78,
        price: 550000,
        originalPrice: 700000,
        maxGuests: 4,
        bedrooms: 2,
        images: ['/farmstay/riverside-1.jpg', '/farmstay/riverside-2.jpg'],
        emoji: '🏠',
        color: 'from-cyan-500 to-blue-600',
        badge: null,
        description: 'Bungalow gỗ trên cù lao giữa sông Tiền. Câu cá, nấu ăn, sống chậm.',
        amenities: ['Wifi', 'Câu cá', 'Thuyền', 'Bếp', 'Vườn rau', 'Gà vịt'],
        highlights: [
            'Câu cá trên sông',
            'Thu hoạch rau vườn',
            'Nấu ăn với nông dân',
            'Tour sông miễn phí'
        ],
        host: {
            name: 'Chú Sáu Sông',
            avatar: '🧔',
            experience: '25 năm ngư dân'
        }
    }
];

// Amenity icons
const AMENITY_ICONS: Record<string, React.ReactNode> = {
    'Wifi miễn phí': <Wifi className="w-4 h-4" />,
    'Wifi': <Wifi className="w-4 h-4" />,
    'Bữa sáng': <Utensils className="w-4 h-4" />,
    'Hồ bơi': <Waves className="w-4 h-4" />,
    'Vườn hoa': <TreePine className="w-4 h-4" />,
    'BBQ': <Sun className="w-4 h-4" />,
};

// Farmstay card
function FarmstayCard({ farmstay }: { farmstay: typeof FARMSTAYS[0] }) {
    const [isLiked, setIsLiked] = useState(false);
    const discount = Math.round((1 - farmstay.price / farmstay.originalPrice) * 100);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-stone-900/50 border border-stone-800 rounded-2xl overflow-hidden group hover:border-emerald-500/30 transition-all"
        >
            {/* Image */}
            <div className={`relative h-56 bg-gradient-to-br ${farmstay.color}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl opacity-30">{farmstay.emoji}</span>
                </div>
                <div className="absolute inset-0 bg-black/20" />

                {/* Badge */}
                {farmstay.badge && (
                    <div className="absolute top-3 left-3 bg-white/90 text-stone-800 text-xs font-bold px-2 py-1 rounded-full">
                        {farmstay.badge}
                    </div>
                )}

                {/* Like button */}
                <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors hover:bg-white/40"
                >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>

                {/* Price */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg">
                    <span className="text-lg font-bold">{(farmstay.price / 1000).toFixed(0)}k</span>
                    <span className="text-xs text-stone-300">/đêm</span>
                </div>

                {/* Discount */}
                <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -{discount}%
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="text-stone-500 text-xs mb-1">{farmstay.type}</p>
                        <h3 className="text-white font-bold text-lg">{farmstay.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-white font-medium">{farmstay.rating}</span>
                        <span className="text-stone-500 text-sm">({farmstay.reviews})</span>
                    </div>
                </div>

                {/* Location */}
                <p className="text-stone-400 text-sm flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />
                    {farmstay.location}
                </p>

                {/* Quick info */}
                <div className="flex gap-3 text-stone-400 text-sm mb-3">
                    <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {farmstay.maxGuests} khách
                    </span>
                    <span className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {farmstay.bedrooms} phòng
                    </span>
                </div>

                {/* Amenities preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {farmstay.amenities.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="bg-stone-800 text-stone-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            {AMENITY_ICONS[amenity] || <Coffee className="w-3 h-3" />}
                            {amenity}
                        </span>
                    ))}
                    {farmstay.amenities.length > 3 && (
                        <span className="text-stone-500 text-xs px-2 py-1">
                            +{farmstay.amenities.length - 3}
                        </span>
                    )}
                </div>

                {/* Host */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{farmstay.host.avatar}</span>
                        <div>
                            <p className="text-white text-sm font-medium">{farmstay.host.name}</p>
                            <p className="text-stone-500 text-xs">{farmstay.host.experience}</p>
                        </div>
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        Đặt ngay
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// Main page
export default function FarmstayPage() {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [guests, setGuests] = useState(2);

    return (
        <div className="min-h-screen bg-stone-950 text-white relative">
            {/* Background Image */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-stone-950/80" />
            </div>

            <div className="relative z-10 w-full">
                {/* Hero */}
                <section className="relative overflow-hidden py-20 px-4">
                    {/* Animated background */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute text-4xl"
                                initial={{ x: -50, y: `${i * 10}%` }}
                                animate={{ x: '110vw' }}
                                transition={{
                                    duration: 20 + i * 2,
                                    repeat: Infinity,
                                    delay: i * 2
                                }}
                            >
                                {['🌿', '🌸', '🪷', '🌻', '🌺'][i % 5]}
                            </motion.div>
                        ))}
                    </div>

                    <div className="relative z-10 max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
                        >
                            <TreePine className="w-4 h-4" />
                            Digital Detox
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold text-white mb-4"
                        >
                            🏡 Farmstay <span className="text-emerald-400">Sa Đéc</span>
                        </motion.h1>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-stone-400 text-lg max-w-2xl mx-auto mb-8"
                        >
                            Nghỉ dưỡng giữa vườn hoa. Sống chậm, thở sâu, ngắm hoa nở.
                        </motion.p>

                        {/* Search bar */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-stone-900/80 backdrop-blur-sm border border-stone-700 rounded-2xl p-4 max-w-3xl mx-auto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-stone-800 rounded-xl p-3">
                                    <label className="text-stone-500 text-xs mb-1 block">Địa điểm</label>
                                    <div className="flex items-center gap-2 text-white">
                                        <MapPin className="w-4 h-4 text-emerald-400" />
                                        Sa Đéc, Đồng Tháp
                                    </div>
                                </div>
                                <div className="bg-stone-800 rounded-xl p-3">
                                    <label className="text-stone-500 text-xs mb-1 block">Ngày</label>
                                    <div className="flex items-center gap-2 text-white">
                                        <Calendar className="w-4 h-4 text-emerald-400" />
                                        <input
                                            type="date"
                                            className="bg-transparent border-none text-white w-full"
                                            onChange={e => setSelectedDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="bg-stone-800 rounded-xl p-3">
                                    <label className="text-stone-500 text-xs mb-1 block">Số khách</label>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-emerald-400" />
                                        <select
                                            value={guests}
                                            onChange={e => setGuests(Number(e.target.value))}
                                            className="bg-transparent border-none text-white w-full"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(n => (
                                                <option key={n} value={n}>{n} khách</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                    Tìm kiếm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Stats */}
                <section className="px-4 pb-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { value: '20+', label: 'Farmstays', icon: <Home className="w-5 h-5" /> },
                                { value: '4.8', label: 'Rating TB', icon: <Star className="w-5 h-5" /> },
                                { value: '500+', label: 'Reviews', icon: <Camera className="w-5 h-5" /> },
                                { value: '24/7', label: 'Hỗ trợ', icon: <Phone className="w-5 h-5" /> },
                            ].map((stat, i) => (
                                <div key={i} className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-center">
                                    <div className="text-emerald-400 mb-2 flex justify-center">{stat.icon}</div>
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-stone-500 text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Listings */}
                <section className="px-4 pb-20">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            Farmstay nổi bật
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {FARMSTAYS.map(farmstay => (
                                <FarmstayCard key={farmstay.id} farmstay={farmstay} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Farmstay */}
                <section className="px-4 pb-20 bg-stone-900/30">
                    <div className="max-w-4xl mx-auto py-12">
                        <h2 className="text-2xl font-bold text-white text-center mb-8">
                            Tại sao chọn Farmstay Sa Đéc?
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: <Sun className="w-8 h-8" />,
                                    title: 'Sống chậm',
                                    desc: 'Thoát khỏi thành phố ồn ào, tận hưởng không khí trong lành giữa vườn hoa'
                                },
                                {
                                    icon: <Utensils className="w-8 h-8" />,
                                    title: 'Ẩm thực địa phương',
                                    desc: 'Nấu ăn cùng nông dân, thưởng thức đặc sản Đồng Tháp: cá lóc, sen, nem'
                                },
                                {
                                    icon: <Camera className="w-8 h-8" />,
                                    title: 'Check-in tuyệt đẹp',
                                    desc: 'Background vườn hoa 100 năm, hoàn hảo cho ảnh Instagram'
                                }
                            ].map((item, i) => (
                                <div key={i} className="bg-stone-800/50 border border-stone-700 rounded-xl p-6 text-center">
                                    <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{item.title}</h3>
                                    <p className="text-stone-400 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
