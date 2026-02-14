"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Phone, MessageCircle } from "lucide-react";

export default function FarmerHelpPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Trung tâm Hỗ trợ Nông dân 🌾</h1>
                <p className="text-stone-500">Hướng dẫn sử dụng & Giải đáp thắc mắc</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Onboarding Kit */}
                <Card className="md:col-span-2 border-stone-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlayCircle className="text-rose-600" />
                            Video Hướng dẫn (Onboarding Kit)
                        </CardTitle>
                        <CardDescription>Dành cho người mới bắt đầu</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { title: "Cách đăng bán hoa mới", duration: "3:45" },
                            { title: "Quy trình xác nhận đơn & đóng gói", duration: "5:20" },
                            { title: "Mẹo chụp ảnh hoa đẹp bằng điện thoại", duration: "4:15" },
                        ].map((video, idx) => (
                            <div key={idx} className="group relative aspect-video bg-stone-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-stone-200 transition-colors">
                                <PlayCircle className="w-12 h-12 text-stone-400 group-hover:text-rose-600 transition-colors" />
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                    {video.duration}
                                </div>
                                <div className="absolute inset-0 flex items-end p-2 pointer-events-none">
                                    <span className="font-medium text-stone-700 text-sm group-hover:text-stone-900 bg-white/50 px-1 rounded truncate w-full">
                                        {video.title}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* FAQ */}
                <Card className="border-stone-200">
                    <CardHeader>
                        <CardTitle>Câu hỏi thường gặp</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Tôi nhận tiền bán hoa khi nào?</AccordionTrigger>
                                <AccordionContent>
                                    Tiền sẽ về Ví nông dân ngay khi khách nhận hàng. Bạn có thể rút về ngân hàng trong 24h (T+0).
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Shipper gãy hoa thì ai chịu?</AccordionTrigger>
                                <AccordionContent>
                                    Sa Đéc Flower Hunt có gói "Bảo hiểm hoa tươi". Nếu lỗi do vận chuyển, nền tảng sẽ đền bù 100% giá trị cho nông dân.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Làm sao để hoa lên "Top Bán Chạy"?</AccordionTrigger>
                                <AccordionContent>
                                    Hãy cập nhật hình ảnh đẹp, trả lời chat nhanh và giữ rating trên 4.8 sao. Hệ thống AI sẽ tự động đề xuất hoa của bạn.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Direct Support */}
                <Card className="bg-stone-900 text-white border-stone-800">
                    <CardHeader>
                        <CardTitle className="text-white">Cần hỗ trợ gấp?</CardTitle>
                        <CardDescription className="text-stone-400">Đội ngũ chăm sóc nông dân (08:00 - 20:00)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full bg-rose-600 hover:bg-rose-700 flex gap-2 text-lg h-12">
                            <Phone className="w-5 h-5" />
                            1900 666 888
                        </Button>
                        <Button variant="outline" className="w-full border-stone-700 hover:bg-stone-800 text-stone-300 flex gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Chat với Admin
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-stone-400 justify-center mt-2">
                            <FileText className="w-4 h-4" />
                            <span className="underline cursor-pointer">Tải tài liệu hướng dẫn (PDF)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
