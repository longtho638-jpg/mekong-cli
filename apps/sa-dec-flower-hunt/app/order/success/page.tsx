"use client"

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"
import Confetti from "react-confetti"
import confetti from "canvas-confetti"
import { CheckCircle, Home } from "lucide-react"
import { motion } from "framer-motion"
import { Check, Download, Home as HomeIcon, Share2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ReferralCard } from "@/components/ReferralCard"

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams()
    const [orderId, setOrderId] = useState("")
    const [orderDate, setOrderDate] = useState("")

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrderId(searchParams.get("id") || "ORD-" + Math.floor(Math.random() * 1000000))
        setOrderDate(new Date().toLocaleString('vi-VN'))

        // Fire confetti
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            })
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            })
        }, 250)

        return () => clearInterval(interval)
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            <Card className="border-0 shadow-2xl overflow-hidden relative bg-white dark:bg-stone-900">
                {/* Receipt jagged edge top */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBMMTAgMEwyMCAxMEgwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBMMTAgMEwyMCAxMEgwWiIgZmlsbD0iIzFjMTkxNyIvPjwvc3ZnPg==')] bg-repeat-x bg-[length:20px_10px] -mt-2 rotate-180"></div>

                <CardHeader className="text-center pt-12 pb-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-stone-900 dark:text-white">Đặt Hàng Thành Công!</CardTitle>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">Cảm ơn bạn đã ủng hộ hoa Sa Đéc</p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-lg space-y-4 border border-dashed border-stone-200 dark:border-stone-700">
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500 dark:text-stone-400">Mã đơn hàng</span>
                            <span className="font-mono font-bold text-stone-900 dark:text-white">{orderId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500 dark:text-stone-400">Thời gian</span>
                            <span className="text-stone-900 dark:text-white">{orderDate}</span>
                        </div>
                        <Separator className="bg-stone-200 dark:bg-stone-700" />
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500 dark:text-stone-400">Phương thức</span>
                            <span className="text-stone-900 dark:text-white">Thanh toán khi nhận hàng (COD)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500 dark:text-stone-400">Trạng thái</span>
                            <span className="text-green-600 font-medium bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs">Đang xử lý</span>
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-sm text-stone-600 dark:text-stone-300">
                            Chúng tôi sẽ gửi tin nhắn xác nhận đến số điện thoại của bạn trong ít phút.
                        </p>
                    </div>

                    <ReferralCard />
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pb-8">
                    <Link href="/" className="w-full">
                        <Button className="w-full bg-stone-900 hover:bg-stone-800 text-white h-12 text-lg">
                            <Home className="mr-2 h-4 w-4" /> Về Trang Chủ
                        </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Lưu Hoá Đơn
                        </Button>
                        <Button variant="outline" className="w-full">
                            <Share2 className="mr-2 h-4 w-4" /> Chia Sẻ
                        </Button>
                    </div>
                </CardFooter>

                {/* Receipt jagged edge bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBMMTAgMEwyMCAxMEgwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBMMTAgMEwyMCAxMEgwWiIgZmlsbD0iIzFjMTkxNyIvPjwvc3ZnPg==')] bg-repeat-x bg-[length:20px_10px] -mb-2"></div>
            </Card>
        </motion.div>
    )
}

export default function OrderSuccessPage() {
    return (
        <div className="min-h-screen bg-stone-950 text-white relative flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_market_hyperreal_1765367468134.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-stone-950/80" />
            </div>

            <div className="relative z-10 w-full flex justify-center">
                <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-stone-400" />}>
                    <SuccessContent />
                </Suspense>
            </div>
        </div>
    )
}
