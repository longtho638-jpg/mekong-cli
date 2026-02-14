"use client";

import { useFarmer } from "@/components/auth/FarmerAuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, Wallet, Building2, History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function FinancePage() {
    const { balance, totalRevenue, withdraw } = useFarmer();
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    const handleWithdraw = async () => {
        if (!withdrawAmount) return;
        const amount = parseInt(withdrawAmount.replace(/\D/g, ""));

        if (amount < 100000) {
            toast.error("Số tiền rút tối thiểu là 100.000đ");
            return;
        }

        setIsProcessing(true);
        const success = await withdraw(amount);
        setIsProcessing(false);

        if (success) {
            toast.success("Yêu cầu rút tiền thành công!", {
                description: `${formatVND(amount)} sẽ về tài khoản ngân hàng trong 5 phút.`
            });
            setWithdrawAmount("");
        } else {
            toast.error("Số dư không đủ!");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Tài chính & Rút tiền 💸</h1>
                <p className="text-stone-500">Minh bạch dòng tiền, nhận tiền nhanh chóng</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet Card */}
                <Card className="bg-stone-900 text-white border-none shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <CardContent className="p-8 relative z-10">
                        <p className="text-stone-400 font-medium mb-1 flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Số dư khả dụng
                        </p>
                        <div className="text-4xl font-bold mb-6">{formatVND(balance)}</div>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/10 rounded-lg p-3">
                                <p className="text-xs text-stone-400">Đang chờ về</p>
                                <p className="text-lg font-bold">2.500.000đ</p>
                            </div>
                            <div className="flex-1 bg-white/10 rounded-lg p-3">
                                <p className="text-xs text-stone-400">Tổng thu nhập</p>
                                <p className="text-lg font-bold">{formatVND(totalRevenue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Withdraw Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rút tiền về ngân hàng</CardTitle>
                        <CardDescription>Liên kết: Vietcombank - Nguyen Van Thanh (**** 8899)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Số tiền muốn rút</Label>
                            <div className="relative">
                                <Input
                                    placeholder="Ví dụ: 5.000.000"
                                    className="text-lg font-bold pl-4"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">VND</span>
                            </div>
                            <p className="text-xs text-stone-500">Phí giao dịch: Miễn phí</p>
                        </div>
                        <Button
                            className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
                            onClick={handleWithdraw}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Đang xử lý..." : "Xác nhận rút tiền"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" /> Lịch sử giao dịch
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-stone-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <ArrowDownLeft className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-stone-900">Rút tiền về VCB</p>
                                        <p className="text-xs text-stone-500">Hôm qua, 14:30</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-stone-900">- 2.000.000đ</p>
                                    <p className="text-xs text-green-600 font-medium">Thành công</p>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center justify-between py-2 border-b last:border-0 border-stone-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-stone-900">Thanh toán đơn hàng #ORD-9850</p>
                                    <p className="text-xs text-stone-500">2 ngày trước</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-stone-900">+ 1.500.000đ</p>
                                <p className="text-xs text-blue-600 font-medium">Từ Ví Hàng</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
