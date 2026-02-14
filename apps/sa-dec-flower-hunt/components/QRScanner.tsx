"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function QRScanner() {
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [isProcessing, setIsAnalyzing] = useState(false);

    const handleScan = (text: string) => {
        if (text && !isProcessing && !scannedData) {
            setIsAnalyzing(true);
            setScannedData(text);

            // Logic xử lý mã QR
            if (text.startsWith("SADEC-") || text.startsWith("AGRIOS-") || text.includes("sadec") || text.includes("agrios")) {
                // Giả lập logic cộng điểm
                const scanned = JSON.parse(localStorage.getItem("agrios_scanned") || "[]");

                // Check duplicate (đơn giản hóa: dùng text làm ID)
                const scanId = text.split("-").pop() || Date.now();

                if (!scanned.includes(Number(scanId)) && !isNaN(Number(scanId))) {
                    scanned.push(Number(scanId));
                    localStorage.setItem("agrios_scanned", JSON.stringify(scanned));
                    toast.success("Đã tìm thấy một vườn hoa mới! 🎉");
                } else if (isNaN(Number(scanId))) {
                    // Mock cho mã test không phải số
                    const randomId = Math.floor(Math.random() * 1000) + 100;
                    scanned.push(randomId);
                    localStorage.setItem("agrios_scanned", JSON.stringify(scanned));
                    toast.success("Đã tìm thấy kho báu! 🌸");
                } else {
                    toast.info("Bạn đã quét vườn này rồi!");
                }

                // Play success sound if possible
                try {
                    const audio = new Audio('/success.mp3'); // Cần file âm thanh hoặc bỏ qua
                    audio.play().catch((playError) => {
                        console.error('[QRScanner] Audio playback failed:', playError);
                    });
                } catch (error) {
                    // Fix #7: Empty catch block antipattern
                    console.error('[QRScanner] Audio initialization failed:', error);
                    // Optional: Notify user via UI state
                }

            } else {
                toast.error("Mã QR không hợp lệ (Không phải mã AGRIOS Flower Hunt)");
            }

            setTimeout(() => {
                setIsAnalyzing(false);
                setScannedData(null); // Reset để quét tiếp
            }, 3000);
        }
    };

    return (
        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden bg-black">
            <Scanner
                onScan={(result) => result[0] && handleScan(result[0].rawValue)}
                onError={(error) => console.log(error)}
                components={{
                    finder: false,
                }}
                styles={{
                    container: { width: "100%", height: "100%" }
                }}
            />

            {/* Overlay UI */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-3xl pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-2xl opacity-50">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
                </div>
                <p className="absolute bottom-8 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-md">
                    Di chuyển camera vào mã QR
                </p>
            </div>

            {/* Result Feedback */}
            {scannedData && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20"
                >
                    <div className="text-center">
                        {scannedData.includes("SADEC") || scannedData.includes("sadec") || scannedData.includes("AGRIOS") || scannedData.includes("agrios") ? (
                            <>
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-white">Thành Công!</h3>
                                <p className="text-green-400 text-sm">{scannedData}</p>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-white">Sai Mã</h3>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
