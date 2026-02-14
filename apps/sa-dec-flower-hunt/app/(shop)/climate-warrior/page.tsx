import { ClimateScanner } from "@/components/ClimateScanner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: 'Climate Warrior | Hoa Chống Biến Đổi Khí Hậu',
    description: 'Công nghệ AI chọn hoa chịu nhiệt cho đô thị.',
};

export default function ClimateWarriorPage() {
    return (
        <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-orange-500 selection:text-white pb-20">
            {/* Nav */}
            <div className="p-4 flex items-center gap-4 sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
                <Link href="/" className="p-2 hover:bg-stone-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="font-mono text-sm tracking-widest text-orange-500 font-bold">PROJECT: CLIMATE WARRIOR</div>
            </div>

            <main className="px-4 py-8 max-w-lg mx-auto">
                <div className="mb-8 text-center space-y-4">
                    <div className="inline-block border border-orange-500/30 bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs font-mono mb-2">
                        BETA FEATURE v1.0
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-br from-white to-stone-500 bg-clip-text text-transparent">
                        Sống Sót Qua<br />Mùa Nắng Nóng
                    </h1>
                    <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
                        Đừng để hoa chết vì nhiệt độ cao. Công nghệ <strong>HeatMap AI™</strong> sẽ giúp bạn tìm ra những "chiến binh" thực thụ cho ban công hướng Tây.
                    </p>
                </div>

                <ClimateScanner />

                <div className="mt-12 space-y-8">
                    <div className="text-center">
                        <p className="text-xs font-mono text-stone-600 mb-4 tracking-widest uppercase">The Science Behind</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                                <div className="text-2xl font-bold text-orange-500 mb-1">35°C+</div>
                                <div className="text-xs text-stone-500">Giới hạn chịu nhiệt<br />thông thường</div>
                            </div>
                            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                                <div className="text-2xl font-bold text-green-500 mb-1">45°C</div>
                                <div className="text-xs text-stone-500">Giới hạn của dòng<br />Warrior</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-6 rounded-3xl border border-stone-700/50">
                        <h3 className="font-bold text-lg mb-2">Chúng Tôi Không Tạo Ra Thiên Nhiên</h3>
                        <p className="text-sm text-stone-400 mb-4">
                            Chúng tôi sử dụng dữ liệu để <strong>chọn lọc</strong> những giống hoa bản địa Sa Đéc có gen trội về khả năng chịu hạn, và mang chúng đến với khu vườn bê tông của bạn.
                        </p>
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-stone-700 border-2 border-stone-800 flex items-center justify-center text-[10px] text-stone-500">
                                    🧬
                                </div>
                            ))}
                            <div className="w-auto px-3 h-8 rounded-full bg-stone-800 border-2 border-stone-800 flex items-center justify-center text-[10px] text-stone-400 pl-4">
                                Research Lab
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
