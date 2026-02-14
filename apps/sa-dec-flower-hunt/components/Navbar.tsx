"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanLine, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px]">
      <div className="bg-white/80 backdrop-blur-md rounded-full px-8 py-3 shadow-lg border border-white/20">
        <div className="flex justify-around items-center">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 ${pathname === "/" ? "text-red-600" : "text-stone-400 hover:text-red-600"} transition-colors`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-bold">Trang chủ</span>
          </Link>

          <Link href="/scan" className="flex flex-col items-center gap-1 text-stone-400 hover:text-red-600 transition-colors -mt-8">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-full shadow-xl border-4 border-white">
              <ScanLine className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-bold mt-2">Quét QR</span>
          </Link>

          <Link
            href="/orders"
            className={`flex flex-col items-center gap-1 ${pathname === "/orders" ? "text-red-600" : "text-stone-400 hover:text-red-600"} transition-colors`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs font-bold">Đơn hàng</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
