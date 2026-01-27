import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Nhượng quyền Marketing Hub
          </h1>
          <h2 className="text-3xl mb-8">
            Tự động hóa cho Tỉnh lẻ Việt Nam
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            Mở Agency Marketing tại địa phương chỉ trong 15 phút.<br />
            AI Video tự động. Chi phí tối ưu. Không cần kỹ năng kỹ thuật.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="#pricing"
              className="bg-emerald-500 hover:bg-emerald-600 px-8 py-4 rounded-lg text-lg font-semibold transition"
            >
              Xem Giá 💰
            </Link>
            <Link
              href="/docs"
              className="bg-slate-700 hover:bg-slate-600 px-8 py-4 rounded-lg text-lg font-semibold transition"
            >
              Tài Liệu 📚
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold mb-3">AI Agent Team</h3>
            <p className="text-slate-300">
              Scout, Editor, Director, Community - Đội ngũ AI làm việc 24/7
            </p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold mb-3">Video Tự Động</h3>
            <p className="text-slate-300">
              Tạo video marketing chuyên nghiệp với ElevenLabs Voice
            </p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-bold mb-3">Chi Phí Tối Ưu</h3>
            <p className="text-slate-300">
              Hybrid Router: OpenRouter + Google Native = Tiết kiệm 70%
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-6 py-20">
        <h2 className="text-5xl font-bold text-center mb-16">
          Chọn Gói Phù Hợp
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter */}
          <div className="bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 hover:border-slate-500 transition">
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <div className="text-4xl font-bold mb-6">
              $0<span className="text-lg text-slate-400">/tháng</span>
            </div>
            <ul className="space-y-3 mb-8 text-slate-300">
              <li>✅ 1 video/ngày</li>
              <li>✅ 1 niche preset</li>
              <li>✅ Cộng đồng support</li>
              <li>❌ White-label</li>
            </ul>
            <Link
              href="/docs"
              className="block text-center bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition"
            >
              Dùng Thử Miễn Phí
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 p-8 rounded-2xl border-2 border-emerald-400 relative transform scale-105 shadow-2xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
              Phổ Biến Nhất
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro Agency</h3>
            <div className="text-4xl font-bold mb-6">
              $497<span className="text-lg opacity-80">/1 lần</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li>✅ 10 videos/ngày</li>
              <li>✅ 10 niche presets</li>
              <li>✅ White-label branding</li>
              <li>✅ Priority support</li>
            </ul>
            <Link
              href="/checkout?tier=pro"
              className="block text-center bg-white text-emerald-700 hover:bg-slate-100 px-6 py-3 rounded-lg font-bold transition"
            >
              Mua Ngay →
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-800 p-8 rounded-2xl border-2 border-blue-500 hover:border-blue-400 transition">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <div className="text-4xl font-bold mb-6">
              $2,997<span className="text-lg text-slate-400">/1 lần</span>
            </div>
            <ul className="space-y-3 mb-8 text-slate-300">
              <li>✅ Unlimited videos</li>
              <li>✅ Unlimited niches</li>
              <li>✅ Custom training</li>
              <li>✅ 10% revenue share</li>
            </ul>
            <Link
              href="/checkout?tier=enterprise"
              className="block text-center bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition"
            >
              Liên Hệ Sales
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Sẵn sàng mở Agency?
        </h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Tham gia cộng đồng các Agency Owner đang tạo ra doanh thu từ Marketing tự động.
        </p>
        <Link
          href="#pricing"
          className="inline-block bg-emerald-500 hover:bg-emerald-600 px-12 py-4 rounded-lg text-xl font-bold transition"
        >
          Bắt Đầu Ngay 🚀
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 text-center text-slate-400">
        <p>&copy; 2025 Mekong Marketing. Powered by Hybrid AI Agents.</p>
      </footer>
    </div>
  );
}
