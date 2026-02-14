"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, Move, Maximize2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ARViewProps {
    isOpen: boolean
    onClose: () => void
    flowerImage: string
    flowerName: string
}

export function ARView({ isOpen, onClose, flowerImage, flowerName }: ARViewProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
        let stream: MediaStream | null = null;
        let isActive = true;

        const initCamera = async () => {
            if (!isOpen) return;

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                if (!isActive) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Fix iOS black screen issue
                    videoRef.current.play().catch(e => console.log("Play error:", e));
                }
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setHasPermission(true);
            } catch (err) {
                console.error("Camera error:", err);
                if (isActive) setHasPermission(false);
            }
        };

        if (isOpen) {
            initCamera();
        }

        return () => {
            isActive = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const oldStream = videoRef.current.srcObject as MediaStream;
                oldStream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [isOpen]);

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black flex flex-col"
            >
                {/* Camera Feed / Fallback */}
                <div className="relative flex-1 overflow-hidden bg-stone-900">
                    {hasPermission === true ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : hasPermission === false ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center">
                            <p>Không thể truy cập Camera. Vui lòng cấp quyền hoặc thử lại trên điện thoại.</p>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    )}

                    {/* Draggable Flower */}
                    <motion.div
                        drag
                        dragMomentum={false}
                        whileDrag={{ scale: scale * 1.1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 touch-none cursor-move"
                        style={{ scale }}
                    >
                        <div className="relative group">
                            <Image
                                src={flowerImage}
                                alt={flowerName}
                                width={256}
                                height={256}
                                className="w-64 h-auto drop-shadow-2xl filter brightness-110 contrast-110"
                            />
                            {/* Guides */}
                            <div className="absolute inset-0 border-2 border-white/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-dashed"></div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Di chuyển & Zoom
                            </div>
                        </div>
                    </motion.div>

                    {/* Controls Overlay */}
                    <div className="absolute top-4 right-4 z-20">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full bg-black/50 text-white hover:bg-black/70 border-0"
                            onClick={onClose}
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4 z-20">
                        <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-4">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-white hover:bg-white/20 rounded-full"
                                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                            >
                                -
                            </Button>
                            <span className="text-white font-bold text-sm w-16 text-center">Size: {Math.round(scale * 100)}%</span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-white hover:bg-white/20 rounded-full"
                                onClick={() => setScale(s => Math.min(2, s + 0.1))}
                            >
                                +
                            </Button>
                        </div>

                        <Button
                            size="icon"
                            className="rounded-full w-14 h-14 bg-white text-black hover:bg-stone-200 shadow-lg"
                            onClick={() => {
                                // Mock Capture
                                const flash = document.createElement('div');
                                flash.className = 'fixed inset-0 bg-white z-[60] animate-out fade-out duration-500';
                                document.body.appendChild(flash);
                                setTimeout(() => flash.remove(), 500);
                            }}
                        >
                            <Camera className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
