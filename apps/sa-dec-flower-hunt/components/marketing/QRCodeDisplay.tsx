"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Printer, QrCode as QrIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
    farmerId: string;
}

interface QRData {
    id: string;
    code: string;
    url: string;
    scanCount: number;
}

export function QRCodeDisplay({ farmerId }: QRCodeDisplayProps) {
    const [qrData, setQrData] = useState<QRData | null>(null);
    const [qrImage, setQrImage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQRCode();
    }, [farmerId]);

    const fetchQRCode = async () => {
        try {
            // Get QR data
            const response = await fetch(`/api/farmers/${farmerId}/qr-code`);
            const data = await response.json();
            if (data.qrCode) {
                setQrData(data.qrCode);
                // Get QR image
                setQrImage(`/api/farmers/${farmerId}/qr-code?format=image`);
            }
        } catch (error) {
            console.error("Failed to fetch QR code:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrImage;
        link.download = `QR-${qrData?.code}.png`;
        link.click();
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="bg-stone-950 border border-stone-800 rounded-sm p-6 animate-pulse">
                <div className="w-48 h-48 bg-stone-800 rounded mx-auto mb-4" />
                <div className="h-4 bg-stone-800 rounded w-32 mx-auto" />
            </div>
        );
    }

    if (!qrData) {
        return (
            <div className="bg-stone-950 border border-red-500/30 rounded-sm p-6 text-center">
                <p className="text-red-400">Không thể tạo mã QR</p>
            </div>
        );
    }

    return (
        <div className="bg-stone-950 border border-emerald-500/30 rounded-sm overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-900/20 border-b border-emerald-500/30 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded flex items-center justify-center">
                        <QrIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Mã QR Cửa Hàng</h3>
                        <p className="text-xs text-stone-400">In ra và dán tại quầy hàng</p>
                    </div>
                </div>
            </div>

            {/* QR Code */}
            <div className="p-8">
                <motion.div
                    className="bg-white p-6 rounded-lg shadow-2xl mx-auto w-fit"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <img
                        src={qrImage}
                        alt="QR Code"
                        className="w-48 h-48"
                    />
                    <div className="text-center mt-4 text-black">
                        <p className="font-bold text-lg">SCAN ĐỂ MUA HOA</p>
                        <p className="text-sm text-stone-600 font-mono">{qrData.code}</p>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-stone-400">
                        <span className="font-bold text-white">{qrData.scanCount}</span> lượt quét
                    </span>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    <Button
                        onClick={handleDownload}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Tải về
                    </Button>
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        In
                    </Button>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-stone-900 border border-stone-800 rounded p-4 text-sm text-stone-400">
                    <p className="font-bold text-white mb-2">💡 Cách sử dụng:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Tải mã QR về hoặc in trực tiếp</li>
                        <li>Dán tại quầy hàng, gian hàng chợ</li>
                        <li>Khách quét mã → Xem sản phẩm → Đặt hàng</li>
                        <li>Theo dõi lượt quét tại dashboard</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
