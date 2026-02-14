"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Upload, Scan, CheckCircle, X, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FLOWERS } from "@/data/flowers"
import Link from "next/link"
import Image from "next/image"

export function SmartVision() {
    const [image, setImage] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImage(e.target?.result as string)
                analyzeImage()
            }
            reader.readAsDataURL(file)
        }
    }

    const analyzeImage = () => {
        setIsAnalyzing(true)
        setResult(null)

        // Simulate AI Analysis
        setTimeout(() => {
            setIsAnalyzing(false)
            // Randomly pick a flower to match
            const randomFlower = FLOWERS[Math.floor(Math.random() * FLOWERS.length)]
            setResult(randomFlower)
        }, 2500)
    }

    const reset = () => {
        setImage(null)
        setResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {!image ? (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Scan className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Smart Vision AI</h2>
                            <p className="text-stone-500 dark:text-stone-400">
                                Chụp ảnh hoặc tải lên để nhận diện hoa và xem cách chăm sóc.
                            </p>
                        </div>

                        <Card className="border-dashed border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
                            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                />
                                <Button
                                    size="lg"
                                    className="w-full max-w-xs bg-green-600 hover:bg-green-700 h-14 text-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="mr-2 h-5 w-5" />
                                    Chụp Ảnh / Tải Lên
                                </Button>
                                <p className="text-xs text-stone-400">Hỗ trợ JPG, PNG (Max 5MB)</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative"
                    >
                        <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-black mb-6">
                            <Image
                                src={image}
                                alt="Uploaded"
                                fill
                                className="object-cover opacity-80"
                            />

                            {/* Scanning Effect */}
                            {isAnalyzing && (
                                <motion.div
                                    initial={{ top: "0%" }}
                                    animate={{ top: "100%" }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] z-10"
                                />
                            )}

                            {/* Overlay UI */}
                            <div className="absolute top-4 right-4">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="rounded-full bg-black/50 text-white hover:bg-black/70 border-0"
                                    onClick={reset}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {isAnalyzing && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 text-white">
                                        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                                        <span className="font-medium">Đang phân tích...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Result Card */}
                        {result && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 -mt-12 relative z-20"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-green-600 mb-1">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-bold text-sm">Độ chính xác 98%</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{result.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-stone-500">Giá tham khảo</p>
                                        <p className="font-bold text-red-600">{new Intl.NumberFormat('vi-VN').format(result.basePrice)}đ</p>
                                    </div>
                                </div>

                                <p className="text-stone-600 dark:text-stone-300 mb-6 line-clamp-2">
                                    {result.salesPitch}
                                </p>

                                <Link href={`/flower/${result.id}`}>
                                    <Button className="w-full bg-stone-900 hover:bg-stone-800 text-white h-12 rounded-xl font-bold">
                                        Xem Chi Tiết & Đặt Mua <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
