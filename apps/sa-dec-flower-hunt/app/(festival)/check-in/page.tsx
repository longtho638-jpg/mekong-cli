
import { CheckInForm } from "@/components/festival/CheckInForm";
import { MapPin } from "lucide-react";
import Image from "next/image";

export const metadata = {
    title: "Check-in Làng Hoa | Sa Đéc Flower Hunt",
    description: "Check-in để nhận Voucher quà tặng độc quyền!",
};

export default function CheckInPage() {
    return (
        <div className="min-h-screen bg-stone-50 pb-20 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-green-600 to-transparent opacity-10 pointer-events-none" />

            <div className="max-w-md mx-auto relative z-10">
                {/* Hero Section */}
                <div className="relative h-[200px] w-full rounded-b-[40px] overflow-hidden shadow-2xl mb-8">
                    <Image
                        src="https://images.unsplash.com/photo-1582469143714-3cf8c9dccb85?q=80&w=800"
                        alt="Sa Dec Flower Festival"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                        <div className="flex items-center gap-2 text-yellow-300 text-sm font-bold mb-1">
                            <MapPin className="w-4 h-4" /> Làng Hoa Sa Đéc
                        </div>
                        <h1 className="text-3xl font-bold leading-tight">Flower Festival<br />Check-in Point</h1>
                    </div>
                </div>

                <div className="px-6">
                    <div className="text-center mb-8">
                        <p className="text-stone-600 leading-relaxed">
                            Chào mừng bạn đến với lễ hội! <br />
                            Hãy check-in ngay để nhận <b>Voucher ưu đãi</b> và tham gia vòng quay may mắn.
                        </p>
                    </div>

                    <CheckInForm />
                </div>
            </div>
        </div>
    );
}
