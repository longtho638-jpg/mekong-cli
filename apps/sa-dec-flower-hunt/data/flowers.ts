export const SIZES = {
  S: { label: "Nhỏ (30cm)", multiplier: 1.0, icon: "🌱" },
  M: { label: "Vừa (50cm)", multiplier: 1.5, icon: "🌿" },
  L: { label: "Lớn (80cm)", multiplier: 2.0, icon: "🌳" },
  XL: { label: "Đại (1m+)", multiplier: 3.0, icon: "🎄" }
} as const;

export type SizeKey = keyof typeof SIZES;

export const FLOWERS = [
  {
    id: 1,
    name: "Cúc Mâm Xôi",
    image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=600",
    vibe: "Tiền Vô Như Nước 💰",
    basePrice: 150000,
    salesPitch: "Form to, chưng được 2 tuần không héo. Đăng ký nhận báo giá sỉ 2026!",
    origin: "Sa Đéc, Đồng Tháp",
    sizesAvailable: ["S", "M", "L", "XL"] as SizeKey[],
    inStock: true
  },
  {
    id: 2,
    name: "Hoa Hồng Sa Đéc",
    image: "https://images.unsplash.com/photo-1548586196-aa5803b77379?q=80&w=600",
    vibe: "Tình Duyên Phơi Phới 💕",
    basePrice: 80000,
    salesPitch: "Giống hồng độc quyền Sa Đéc, cánh dày, thơm lâu. HOT Tết 2026!",
    origin: "Làng hoa Sa Đéc",
    sizesAvailable: ["S", "M", "L"] as SizeKey[],
    inStock: true
  },
  {
    id: 3,
    name: "Vạn Thọ Pháp",
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600",
    vibe: "Sống Lâu Trăm Tuổi 🐢",
    basePrice: 50000,
    salesPitch: "Màu cam rực rỡ, ý nghĩa trường thọ. Quà Tết cho bố mẹ!",
    origin: "Sa Đéc, Đồng Tháp",
    sizesAvailable: ["S", "M", "L", "XL"] as SizeKey[],
    inStock: true
  },
  {
    id: 4,
    name: "Hoa Giấy Đỏ",
    image: "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?q=80&w=600",
    vibe: "Rực Rỡ Quanh Năm 🌈",
    basePrice: 120000,
    salesPitch: "Dễ chăm, nở quanh năm. Phong thủy cực tốt cho nhà mới!",
    origin: "Làng hoa Sa Đéc",
    sizesAvailable: ["M", "L", "XL"] as SizeKey[],
    inStock: true
  },
  {
    id: 5,
    name: "Cát Tường",
    image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?q=80&w=600",
    vibe: "May Mắn Tràn Trề ✨",
    basePrice: 70000,
    salesPitch: "Tên Cát Tường = Điềm Lành. Ai cũng cần một chậu trong nhà!",
    origin: "Sa Đéc, Đồng Tháp",
    sizesAvailable: ["S", "M", "L"] as SizeKey[],
    inStock: true
  },
  {
    id: 6,
    name: "Mai Vàng",
    image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?q=80&w=600",
    vibe: "Xuân Về Ngập Tràn 🌼",
    basePrice: 200000,
    salesPitch: "Mai Vàng chính gốc miền Tây. Nở đúng Mùng 1 Tết!",
    origin: "Làng hoa Sa Đéc",
    sizesAvailable: ["S", "M", "L", "XL"] as SizeKey[],
    inStock: true
  }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

export const calculatePrice = (basePrice: number, size: SizeKey) => {
  return Math.round(basePrice * SIZES[size].multiplier);
};
