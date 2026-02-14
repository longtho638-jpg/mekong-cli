import { Share2 } from "lucide-react";
import { ReferralDashboard } from "@/components/ReferralDashboard";

export const metadata = {
    title: 'Mời bạn bè - Nhận quà kép | Sa Đéc Flower Hunt',
    description: 'Chia sẻ vườn hoa Sa Đéc với bạn bè để nhận ngay 30.000đ.',
};

export default function SharePage() {
    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Simple Header */}
            <div className="bg-white p-4 sticky top-0 z-50 shadow-sm flex items-center justify-center">
                <h1 className="font-bold text-lg">Chương Trình Đối Tác</h1>
            </div>

            <div className="max-w-md mx-auto px-4 py-8">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">Lan Tỏa Hương Sắc</h1>
                    <p className="text-stone-500">Cùng mang hoa Sa Đéc đi muôn nơi</p>
                </div>

                <ReferralDashboard />

                <p className="text-center text-xs text-stone-400 mt-8 max-w-xs mx-auto">
                    *Chương trình áp dụng cho đơn hàng đầu tiên của người được giới thiệu.
                    Tiền thưởng sẽ được gửi qua ZaloPay hoặc Voucher.
                </p>
            </div>
        </div>
    );
}
