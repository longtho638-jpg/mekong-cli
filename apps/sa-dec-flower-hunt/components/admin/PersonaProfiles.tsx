import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, Heart, AlertTriangle, Target, Camera, Wallet, Home } from "lucide-react";
import Image from "next/image";

interface Persona {
  id: string;
  name: string;
  archetype: string;
  quote: string;
  image: string;
  goals: string[];
  pains: string[];
  psychDrivers: string[];
  color: string;
  icon: React.ReactNode;
}

const PERSONAS: Persona[] = [
  {
    id: '1',
    name: 'Chị Lan Tết',
    archetype: 'The Traditionalist',
    quote: "Tết là phải có hoa Sa Đéc mới ra không khí.",
    image: '/avatars/lan.jpg', // Placeholder logic
    goals: ['Giữ gìn truyền thống', 'Làm đẹp nhà cửa', 'Gắn kết gia đình'],
    pains: ['Sợ mua phải hoa kém chất lượng', 'Sợ hoa héo trước Mùng 1', 'Giá bị hét cao ngày cận Tết'],
    psychDrivers: ['Family', 'Order', 'Acceptance'],
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <Home className="w-5 h-5" />
  },
  {
    id: '2',
    name: 'Gen Z Săn Ảnh',
    archetype: 'The Experience Hunter',
    quote: "Check-in vườn hoa là chính, mua hoa là phụ.",
    image: '/avatars/genz.jpg',
    goals: ['Có bộ ảnh Tết viral TikTok', 'Trải nghiệm công nghệ AR', 'Khám phá địa điểm mới'],
    pains: ['Sợ đông đúc chen lấn', 'Sợ góc chụp xấu/nhàm chán', 'Sợ hết pin/3G yếu'],
    psychDrivers: ['Status', 'Social Contact', 'Curiosity'],
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Camera className="w-5 h-5" />
  },
  {
    id: '3',
    name: 'Anh Tuấn Buôn',
    archetype: 'The Wholesaler',
    quote: "Giá tốt, nguồn ổn, lời cao.",
    image: '/avatars/tuan.jpg',
    goals: ['Tối đa hóa lợi nhuận mùa Tết', 'Nguồn hàng ổn định', 'Vận chuyển an toàn'],
    pains: ['Sợ đứt hàng giữa chừng', 'Sợ vận chuyển làm gãy hoa', 'Sợ khách lẻ ép giá'],
    psychDrivers: ['Power', 'Saving', 'Independence'],
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Wallet className="w-5 h-5" />
  }
];

export function PersonaProfiles() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PERSONAS.map((persona) => (
        <Card key={persona.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
          <CardHeader className={`pb-4 border-b ${persona.color} bg-opacity-50`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                        {persona.icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">{persona.name}</CardTitle>
                        <p className="text-xs font-medium opacity-80">{persona.archetype}</p>
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
                <Quote className="absolute -top-2 -left-1 w-6 h-6 text-stone-200 -z-10" />
                <p className="text-sm italic text-stone-600 dark:text-stone-300 pl-4">
                    "{persona.quote}"
                </p>
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-stone-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Goals
                </h4>
                <ul className="space-y-1">
                    {persona.goals.map((goal, i) => (
                        <li key={i} className="text-sm text-stone-700 dark:text-stone-200 flex items-start gap-2">
                            <span className="block w-1 h-1 mt-2 rounded-full bg-green-500" />
                            {goal}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-stone-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Pains
                </h4>
                <ul className="space-y-1">
                    {persona.pains.map((pain, i) => (
                        <li key={i} className="text-sm text-stone-700 dark:text-stone-200 flex items-start gap-2">
                             <span className="block w-1 h-1 mt-2 rounded-full bg-red-500" />
                             {pain}
                        </li>
                    ))}
                </ul>
            </div>

             <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                <div className="flex flex-wrap gap-2">
                    {persona.psychDrivers.map((driver) => (
                        <Badge key={driver} variant="secondary" className="text-[10px] font-normal">
                            {driver}
                        </Badge>
                    ))}
                </div>
             </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
