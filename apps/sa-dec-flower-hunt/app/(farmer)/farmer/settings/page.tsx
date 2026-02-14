"use client";

import { useFarmer } from "@/components/auth/FarmerAuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SettingsPage() {
    const { profile } = useFarmer();

    const handleSave = () => {
        toast.success("Đã lưu cài đặt thành công!");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Cài đặt tài khoản ⚙️</h1>
                <p className="text-stone-500">Quản lý thông tin cá nhân và cửa hàng</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin nhà vườn</CardTitle>
                        <CardDescription>Thông tin này sẽ hiển thị cho khách hàng</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên hiển thị</Label>
                            <Input defaultValue={profile.farmerName} />
                        </div>
                        <div className="space-y-2">
                            <Label>Địa chỉ</Label>
                            <Input defaultValue={profile.location} />
                        </div>
                        <div className="space-y-2">
                            <Label>Số điện thoại</Label>
                            <Input defaultValue="0912 345 678" />
                        </div>
                        <Button className="w-full bg-stone-900 text-white" onClick={handleSave}>Lưu thay đổi</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cấu hình bán hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Tạm nghỉ bán</Label>
                                <p className="text-xs text-stone-500">Ẩn toàn bộ sản phẩm khỏi cửa hàng</p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Nhận đơn đặt trước Tết</Label>
                                <p className="text-xs text-stone-500">Cho phép khách đặt cọc trước</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Thông báo từ Agri-Copilot</Label>
                                <p className="text-xs text-stone-500">Nhận lời khuyên nông nghiệp mỗi ngày</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
