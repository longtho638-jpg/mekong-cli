#!/bin/bash
set -e

echo "🌸 Sa Dec Flower Hunt - Automated Setup Script"
echo "================================================"
echo ""

# Step 1: Create Next.js App
echo "📦 Creating Next.js 15 app..."
npx create-next-app@latest sadec-flower-hunt \
  --typescript \
  --tailwind \
  --eslint \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm \
  --yes

cd sadec-flower-hunt

# Step 2: Install Dependencies
echo ""
echo "📚 Installing dependencies..."
npm install framer-motion lucide-react clsx tailwind-merge

# Step 3: Create Directories
echo ""
echo "📁 Creating project structure..."
mkdir -p components data

# Step 4: Create data/flowers.ts
echo "🌺 Generating flower data..."
cat > data/flowers.ts << 'EOF'
export const FLOWERS = [
  {
    id: 1,
    name: "Cúc Mâm Xôi",
    image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=600",
    vibe: "Tiền Vô Như Nước 💰",
    price: "150k"
  },
  {
    id: 2,
    name: "Hoa Hồng Sa Đéc",
    image: "https://images.unsplash.com/photo-1548586196-aa5803b77379?q=80&w=600",
    vibe: "Tình Duyên Phơi Phới 💕",
    price: "80k"
  },
  {
    id: 3,
    name: "Vạn Thọ Pháp",
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600",
    vibe: "Sống Lâu Trăm Tuổi 🐢",
    price: "50k"
  },
  {
    id: 4,
    name: "Hoa Giấy",
    image: "https://images.unsplash.com/photo-1534234828563-025c93d31d8e?q=80&w=600",
    vibe: "Rực Rỡ Quanh Năm 🌈",
    price: "120k"
  },
  {
    id: 5,
    name: "Cát Tường",
    image: "https://images.unsplash.com/photo-1563241527-9d2b33d36eb3?q=80&w=600",
    vibe: "May Mắn Tràn Trề ✨",
    price: "70k"
  },
  {
    id: 6,
    name: "Mai Vàng",
    image: "https://images.unsplash.com/photo-1462275646964-a0e338679cde?q=80&w=600",
    vibe: "Xuân Về Ngập Tràn 🌼",
    price: "200k"
  }
];
EOF

# Step 5: Create components/Navbar.tsx
echo "🎨 Creating navbar component..."
cat > components/Navbar.tsx << 'EOF'
"use client";

import { Home, ScanLine, Gift } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px]">
      <div className="bg-white/80 backdrop-blur-md rounded-full px-8 py-3 shadow-lg border border-white/20">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-red-600">
            <Home className="w-6 h-6" />
            <span className="text-xs font-bold">Trang chủ</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-red-600 transition-colors -mt-8">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-full shadow-xl border-4 border-white">
              <ScanLine className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-bold mt-2">Quét QR</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-red-600 transition-colors">
            <Gift className="w-6 h-6" />
            <span className="text-xs font-bold">Bộ sưu tập</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
EOF

# Step 6: Overwrite app/page.tsx
echo "🏠 Creating homepage..."
cat > app/page.tsx << 'EOF'
"use client";

import { FLOWERS } from "@/data/flowers";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-stone-100 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-red-600">
          🌸 Sa Đéc Hunt 2026
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Khám phá vẻ đẹp Xuân miền Tây
        </p>
      </header>

      {/* TikTok Feed */}
      <div className="flex flex-col">
        {FLOWERS.map((flower, index) => (
          <motion.div
            key={flower.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative w-full aspect-[3/4] mb-3"
          >
            {/* Image */}
            <img
              src={flower.image}
              alt={flower.name}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {flower.name}
              </h2>
              <p className="text-yellow-300 font-bold text-sm uppercase tracking-wider mb-3">
                {flower.vibe}
              </p>
              
              {/* CTA Button */}
              <button className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl hover:scale-110 active:scale-95 transition-all inline-flex items-center gap-2">
                Chi Tiết
                <span className="text-lg">→</span>
              </button>
            </div>

            {/* Price Tag */}
            <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              {flower.price}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navbar */}
      <Navbar />
    </div>
  );
}
EOF

# Step 7: Overwrite app/globals.css
echo "🎨 Applying global styles..."
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  background-color: #FDFBF7;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.font-serif {
  font-family: Georgia, 'Times New Roman', Times, serif;
}
EOF

# Step 8: Overwrite tailwind.config.ts
echo "⚙️  Configuring Tailwind..."
cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#D0312D",
        background: "#FDFBF7",
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
      backdropBlur: {
        md: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
EOF

# Step 9: Update layout.tsx for mobile container
echo "📱 Setting up mobile layout..."
cat > app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sa Đéc Flower Hunt 2026",
  description: "Khám phá vẻ đẹp hoa xuân miền Tây",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-stone-100 min-h-screen flex justify-center">
        <main className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl relative">
          {children}
        </main>
      </body>
    </html>
  );
}
EOF

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🚀 To start the app, run:"
echo "   cd sadec-flower-hunt"
echo "   npm run dev"
echo ""
echo "🌸 Open http://localhost:3000 in your browser"
echo ""
