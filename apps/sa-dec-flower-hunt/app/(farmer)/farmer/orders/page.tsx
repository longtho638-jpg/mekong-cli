"use client";

import { useFarmer } from "@/components/auth/FarmerAuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, Printer, Truck } from "lucide-react";

const MOCK_ORDERS = [
    { id: "ORD-9921", customer: "Chị Lan (TP.HCM)", items: "2x Cúc Mâm Xôi (L)", total: 300000, status: "pending", time: "10 phút trước" },
    { id: "ORD-9920", customer: "Anh Minh (Cần Thơ)", items: "5x Vạn Thọ Pháp", total: 250000, status: "pending", time: "30 phút trước" },
    { id: "ORD-9899", customer: "Cô Ba (Sa Đéc)", items: "1x Mai Vàng (Gốc nhỏ)", total: 500000, status: "processing", time: "2 giờ trước" },
    { id: "ORD-9850", customer: "Nguyễn Văn A (Hà Nội)", items: "10x Cúc Mâm Xôi (S)", total: 1500000, status: "completed", time: "Hôm qua" },
];

export default function OrderManagementPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Quản lý đơn hàng 📦</h1>
                    <p className="text-stone-500">Xử lý đơn hàng nhanh chóng để khách vui</p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="pending">Mới (2)</TabsTrigger>
                    <TabsTrigger value="processing">Đang xử lý (1)</TabsTrigger>
                    <TabsTrigger value="shipping">Đang giao (0)</TabsTrigger>
                    <TabsTrigger value="completed">Đã xong</TabsTrigger>
                </TabsList>

                <div className="mt-6 space-y-4">
                    {MOCK_ORDERS.map((order) => (
                        <Card key={order.id} className="border-l-4 border-l-stone-900 shadow-sm">
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-bold text-lg text-stone-900">{order.id}</span>
                                        <Badge variant={
                                            order.status === 'pending' ? 'destructive' :
                                                order.status === 'processing' ? 'default' : 'secondary'
                                        } className={order.status === 'pending' ? 'animate-pulse' : ''}>
                                            {order.status === 'pending' ? 'Mới tinh ✨' :
                                                order.status === 'processing' ? 'Đang đóng gói' : 'Hoàn thành'}
                                        </Badge>
                                        <span className="text-xs text-stone-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {order.time}
                                        </span>
                                    </div>
                                    <div className="font-medium text-stone-700">{order.customer}</div>
                                    <div className="text-sm text-stone-500">{order.items}</div>
                                </div>

                                <div className="text-right min-w-[120px]">
                                    <div className="font-bold text-stone-900 text-lg">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                                    </div>
                                    <div className="text-xs text-stone-400">COD (Thu hộ)</div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    {order.status === 'pending' && (
                                        <>
                                            <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                                                <Printer className="w-4 h-4 mr-2" /> In đơn
                                            </Button>
                                            <Button size="sm" className="bg-stone-900 text-white flex-1 md:flex-none">
                                                Xác nhận
                                            </Button>
                                        </>
                                    )}
                                    {order.status === 'processing' && (
                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold flex-1 md:flex-none">
                                            <Truck className="w-4 h-4 mr-2" /> Gọi Shipper
                                        </Button>
                                    )}
                                    {order.status === 'completed' && (
                                        <Button variant="ghost" size="sm" className="text-green-600 cursor-default hover:text-green-600 hover:bg-green-50">
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Đã giao thành công
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </Tabs>
        </div>
    );
}
