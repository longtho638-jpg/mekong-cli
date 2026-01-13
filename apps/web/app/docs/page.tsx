export default function DocsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20">
            <div className="container mx-auto px-6 max-w-4xl">
                <h1 className="text-5xl font-bold mb-12">Tài Liệu</h1>

                <div className="prose prose-invert max-w-none">
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <pre className="text-sm overflow-x-auto">
                                <code>{`# 1. Cài đặt CLI
npm install -g mekong-cli

# 2. Khởi tạo dự án
mekong init my-agency

# 3. Cấu hình Vibe
mekong setup-vibe

# 4. Kích hoạt license (Nếu có Pro/Enterprise)
mekong activate --key mk_live_pro_xxxxx

# 5. Triển khai
mekong deploy`}</code>
                            </pre>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-4">Niche Presets (Pro)</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                '🌾 Rice Trading (Lúa Gạo)',
                                '🐟 Fish/Seafood (Cá Tra)',
                                '🛋️ Furniture (Nội Thất)',
                                '🏗️ Construction Materials',
                                '🚜 Agriculture Tools',
                                '🏠 Real Estate',
                                '🍜 Restaurants',
                                '💅 Beauty/Spa',
                                '🚗 Automotive',
                                '📚 Education'
                            ].map((niche, i) => (
                                <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                    {niche}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-4">FAQ</h2>
                        <div className="space-y-4">
                            <details className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <summary className="font-semibold cursor-pointer">
                                    Tôi cần kiến thức kỹ thuật không?
                                </summary>
                                <p className="mt-2 text-slate-300">
                                    Không. Mekong-CLI tự động hóa toàn bộ quá trình. Chỉ cần chạy vài lệnh đơn giản.
                                </p>
                            </details>

                            <details className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <summary className="font-semibold cursor-pointer">
                                    Chi phí API hàng tháng là bao nhiêu?
                                </summary>
                                <p className="mt-2 text-slate-300">
                                    Với Hybrid Router: ~$50-100/tháng cho 10 videos/ngày. Tiết kiệm 70% so với dùng Google Gemini trực tiếp.
                                </p>
                            </details>

                            <details className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <summary className="font-semibold cursor-pointer">
                                    Có hỗ trợ tiếng Việt phương ngữ không?
                                </summary>
                                <p className="mt-2 text-slate-300">
                                    Có. Mỗi niche preset được tối ưu cho phương ngữ địa phương (Nam Bộ, Miền Trung, v.v.).
                                </p>
                            </details>
                        </div>
                    </section>
                </div>

                <div className="mt-12 text-center">
                    <a href="/" className="text-emerald-400 hover:underline">
                        ← Quay lại trang chủ
                    </a>
                </div>
            </div>
        </div>
    );
}
