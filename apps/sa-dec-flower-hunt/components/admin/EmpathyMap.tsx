import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Eye, Heart, Zap } from "lucide-react";

export function EmpathyMap() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Surface Pains */}
      <Card className="bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-600">
                <Eye className="w-4 h-4" /> Surface Pains (See/Hear)
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">Giá hoa tăng chóng mặt ngày 28-29 Tết.</li>
                <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">Vận chuyển làm gãy cành, rụng nụ.</li>
                <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">Thời tiết thất thường, hoa không nở đúng dịp.</li>
            </ul>
        </CardContent>
      </Card>

      {/* Latent Pains */}
      <Card className="bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-600">
                <Cloud className="w-4 h-4" /> Latent Pains (Feel/Fear)
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                 <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100 border-l-4 border-l-red-400">
                    Sợ bị họ hàng đánh giá là "không biết lo Tết" nếu nhà thiếu hoa đẹp.
                 </li>
                 <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">
                    FOMO: Sợ bạn bè có ảnh đẹp check-in Sa Đéc mà mình không có.
                 </li>
                 <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">
                    Sợ bị lừa ("treo đầu dê bán thịt chó") khi mua online.
                 </li>
            </ul>
        </CardContent>
      </Card>

      {/* Dream State */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border-pink-100 dark:border-pink-900">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-pink-700 dark:text-pink-400">
                <Heart className="w-4 h-4" /> Dream State (Gain)
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                 <li className="p-2 bg-white/60 dark:bg-stone-800/60 rounded shadow-sm">"Nhà mình hoa đẹp nhất xóm, ai vào cũng khen."</li>
                 <li className="p-2 bg-white/60 dark:bg-stone-800/60 rounded shadow-sm">"Bộ ảnh Tết triệu view, được khen là biết chỗ chơi độc lạ."</li>
                 <li className="p-2 bg-white/60 dark:bg-stone-800/60 rounded shadow-sm">"Buôn may bán đắt, năm mới tài lộc dồi dào."</li>
            </ul>
        </CardContent>
      </Card>

      {/* Triggers */}
      <Card className="bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-600">
                <Zap className="w-4 h-4" /> Triggers (Action)
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                 <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">Limited Edition: "Giống hoa mới, chỉ còn 50 chậu."</li>
                 <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">Storytelling: "Vườn hoa di sản 100 năm tuổi."</li>
                 <li className="p-2 bg-white dark:bg-stone-800 rounded shadow-sm border border-stone-100">Social Proof: "KOL A, Ca sĩ B vừa check-in tại đây."</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
