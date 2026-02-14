import { ShieldCheck, Truck, Clock } from 'lucide-react';

export function TrustBadges() {
    return (
        <div className="grid grid-cols-3 gap-2 my-6">
            <div className="flex flex-col items-center text-center p-3 bg-green-50 rounded-xl border border-green-100">
                <ShieldCheck className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-xs font-bold text-green-800">Bảo Hành</span>
                <span className="text-[10px] text-green-600">Tươi 3 ngày</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Truck className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-blue-800">Giao Nhanh</span>
                <span className="text-[10px] text-blue-600">Trong 24h</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                <Clock className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-xs font-bold text-orange-800">Tại Vườn</span>
                <span className="text-[10px] text-orange-600">Cắt sáng sớm</span>
            </div>
        </div>
    );
}
