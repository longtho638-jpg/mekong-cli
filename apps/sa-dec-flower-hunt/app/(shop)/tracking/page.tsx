import { DeliveryTracking } from "@/components/logistics/DeliveryTracking";

export const metadata = {
    title: "Theo dõi đơn hàng | Sa Đéc Flower Hunt",
    description: "Kiểm tra hành trình đơn hàng hoa Tết của bạn.",
};

export default function TrackingPage() {
    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4">
            <DeliveryTracking />

            {/* Help Section */}
            <div className="max-w-xl mx-auto mt-12 text-center text-sm text-stone-500">
                <p>Cần hỗ trợ?</p>
                <p className="font-bold text-stone-900 mt-1">Hotline: 1900 888 888 (24/7)</p>
            </div>
        </div>
    );
}
