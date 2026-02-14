'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Volume2, VolumeX, Video, Phone, MapPin, Clock, Truck, Flower2, ChevronRight } from 'lucide-react'

interface VideoHeroProps {
    videoSrc?: string
    posterSrc?: string
    onCallFarmer?: () => void
    onBuyNow?: () => void
}

export function VideoHeroSection({
    videoSrc = '/videos/flower-journey.mp4',
    posterSrc = '/images/hero-poster.jpg',
    onCallFarmer,
    onBuyNow
}: VideoHeroProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isMuted, setIsMuted] = useState(true)
    const [isLoaded, setIsLoaded] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    // Journey timeline steps
    const journeySteps = [
        { time: '5:00 AM', icon: Flower2, label: 'Cắt hoa', description: 'Nông dân cắt hoa lúc sáng sớm' },
        { time: '6:30 AM', icon: MapPin, label: 'Đóng gói', description: 'Đóng gói cẩn thận với cold chain' },
        { time: '7:00 AM', icon: Truck, label: 'Vận chuyển', description: 'Xe lạnh chuyên dụng' },
        { time: '11:00 AM', icon: Clock, label: 'Đến nhà', description: 'Giao đến tận tay bạn' },
    ]

    // Auto-rotate journey steps
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % journeySteps.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [journeySteps.length])

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    return (
        <section className="relative w-full min-h-[80vh] overflow-hidden bg-black">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                {/* Fallback gradient if no video */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-black to-stone-900" />

                {/* Video element */}
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-60' : 'opacity-0'}`}
                    src={videoSrc}
                    poster={posterSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={() => setIsLoaded(true)}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-6 py-16 flex flex-col justify-center min-h-[80vh]">

                {/* Live Badge */}
                <div className="mb-6">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2 inline-block animate-ping" />
                        LIVE từ vườn Sa Đéc
                    </Badge>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl leading-tight">
                    Hoa tươi từ vườn
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400">
                        đến tay bạn trong 6 giờ
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-stone-300 mb-8 max-w-2xl">
                    Xem nông dân cắt hoa, theo dõi hành trình cold-chain, nhận hoa tươi nhất miền Tây
                </p>

                {/* Journey Timeline */}
                <div className="flex flex-wrap gap-4 mb-10">
                    {journeySteps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = index === currentStep
                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${isActive
                                        ? 'bg-emerald-500/20 border border-emerald-500/50 scale-105'
                                        : 'bg-white/5 border border-white/10'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-500' : 'bg-white/10'
                                    }`}>
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                                </div>
                                <div>
                                    <div className={`text-xs font-mono ${isActive ? 'text-emerald-400' : 'text-stone-500'}`}>
                                        {step.time}
                                    </div>
                                    <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-stone-300'}`}>
                                        {step.label}
                                    </div>
                                </div>
                                {index < journeySteps.length - 1 && (
                                    <ChevronRight className="w-4 h-4 text-stone-600 hidden md:block" />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                    <Button
                        size="lg"
                        onClick={onCallFarmer}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/25 group"
                    >
                        <Video className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                        Gọi Video với Nông Dân
                        <Badge className="ml-2 bg-white/20">Mới</Badge>
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        onClick={onBuyNow}
                        className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                    >
                        <Phone className="w-5 h-5 mr-2" />
                        Mua ngay
                    </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap gap-6 mt-8 text-sm text-stone-400">
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span>Cold chain tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span>Hoàn tiền 100% nếu héo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span>Giao trong 6 giờ</span>
                    </div>
                </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                    onClick={toggleMute}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-white/50 animate-bounce">
                <span className="text-xs mb-2">Kéo xuống xem thêm</span>
                <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                    <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
                </div>
            </div>
        </section>
    )
}
