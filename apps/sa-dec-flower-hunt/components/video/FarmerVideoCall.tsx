'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    User,
    Clock,
    Star,
    MapPin,
    Flower2,
    MessageCircle
} from 'lucide-react'

interface Farmer {
    id: string
    name: string
    avatar: string
    location: string
    specialty: string
    rating: number
    isOnline: boolean
    productsCount: number
}

interface FarmerVideoCallProps {
    farmerId?: string
    onClose?: () => void
}

// Demo farmers list
const DEMO_FARMERS: Farmer[] = [
    {
        id: 'farmer-1',
        name: 'Chú Hai Hoa Mai',
        avatar: '👨‍🌾',
        location: 'Vườn Tân Quy Đông',
        specialty: 'Mai vàng, Bonsai',
        rating: 4.9,
        isOnline: true,
        productsCount: 47
    },
    {
        id: 'farmer-2',
        name: 'Cô Ba Hồng',
        avatar: '👩‍🌾',
        location: 'Làng hoa Sa Đéc',
        specialty: 'Hồng, Cúc, Ly',
        rating: 4.8,
        isOnline: true,
        productsCount: 35
    },
    {
        id: 'farmer-3',
        name: 'Anh Tư Lan',
        avatar: '👨‍🌾',
        location: 'Xã Tân Khánh Đông',
        specialty: 'Lan hồ điệp',
        rating: 4.7,
        isOnline: false,
        productsCount: 28
    }
]

export function FarmerVideoCall({ farmerId, onClose }: FarmerVideoCallProps) {
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
    const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle')
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOn, setIsVideoOn] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [roomUrl, setRoomUrl] = useState<string | null>(null)

    // Find farmer by ID or show list
    useEffect(() => {
        if (farmerId) {
            const farmer = DEMO_FARMERS.find(f => f.id === farmerId)
            if (farmer) setSelectedFarmer(farmer)
        }
    }, [farmerId])

    // Call duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (callState === 'connected') {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [callState])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const startCall = useCallback(async (farmer: Farmer) => {
        setSelectedFarmer(farmer)
        setCallState('connecting')

        try {
            // Create real Daily.co room
            const response = await fetch('/api/video-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmerId: farmer.id,
                    farmerName: farmer.name,
                    buyerName: 'Khách hàng'
                })
            })

            const data = await response.json()

            if (data.success && data.room?.url) {
                // Store room URL for later use
                setRoomUrl(data.room.url)
                setCallState('connected')
            } else {
                // Fallback to demo mode
                console.log('Using demo mode:', data.message)
                setCallState('connected')
            }
        } catch (error) {
            console.error('Failed to create room:', error)
            // Fallback to demo mode on error
            setCallState('connected')
        }
    }, [])

    const endCall = useCallback(() => {
        setCallState('ended')
        setCallDuration(0)
        setRoomUrl(null)
        setTimeout(() => {
            setCallState('idle')
            setSelectedFarmer(null)
        }, 1500)
    }, [])

    // Farmer selection view
    if (!selectedFarmer && callState === 'idle') {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-stone-900 border-stone-800">
                    <CardHeader className="border-b border-stone-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Video className="w-5 h-5 text-emerald-500" />
                                Chọn Nông Dân để Gọi Video
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-400">
                                ✕
                            </Button>
                        </div>
                        <p className="text-sm text-stone-400">
                            Kết nối trực tiếp với nông dân để chọn hoa và đặt hàng
                        </p>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {DEMO_FARMERS.map(farmer => (
                            <div
                                key={farmer.id}
                                className={`p-4 rounded-lg border transition-all cursor-pointer ${farmer.isOnline
                                    ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                                    : 'border-stone-700 bg-stone-800/50 opacity-60'
                                    }`}
                                onClick={() => farmer.isOnline && startCall(farmer)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center text-2xl">
                                            {farmer.avatar}
                                        </div>
                                        {farmer.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-stone-900" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white">{farmer.name}</h3>
                                            {farmer.isOnline ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Online</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-stone-500 text-xs">Offline</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-stone-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {farmer.location}
                                        </p>
                                        <p className="text-sm text-stone-500 flex items-center gap-1">
                                            <Flower2 className="w-3 h-3" />
                                            {farmer.specialty}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                                            <Star className="w-4 h-4 fill-current" />
                                            {farmer.rating}
                                        </div>
                                        <p className="text-xs text-stone-500">{farmer.productsCount} sản phẩm</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <p className="text-xs text-center text-stone-500 mt-4">
                            💡 Cuộc gọi 5 phút đầu miễn phí
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Video call view
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Call header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-xl">
                        {selectedFarmer?.avatar}
                    </div>
                    <div>
                        <h3 className="font-bold text-white">{selectedFarmer?.name}</h3>
                        <p className="text-sm text-stone-400">
                            {callState === 'connecting' && 'Đang kết nối...'}
                            {callState === 'connected' && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(callDuration)}
                                </span>
                            )}
                            {callState === 'ended' && 'Cuộc gọi kết thúc'}
                        </p>
                    </div>
                </div>
                <Badge className={`${callState === 'connected' ? 'bg-emerald-500' : 'bg-stone-700'
                    }`}>
                    {callState === 'connecting' && '⏳ Connecting'}
                    {callState === 'connected' && '🔴 Live'}
                    {callState === 'ended' && '✓ Ended'}
                </Badge>
            </div>

            {/* Video area */}
            <div className="flex-1 relative">
                {/* Remote video (farmer) */}
                <div className="absolute inset-0 bg-gradient-to-br from-stone-900 to-stone-800 flex items-center justify-center">
                    {callState === 'connecting' && (
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center text-5xl mx-auto mb-4 animate-pulse">
                                {selectedFarmer?.avatar}
                            </div>
                            <p className="text-white">Đang gọi {selectedFarmer?.name}...</p>
                            <p className="text-stone-400 text-sm">Vui lòng chờ trong giây lát</p>
                        </div>
                    )}
                    {callState === 'connected' && (
                        <div className="text-center">
                            <div className="w-32 h-32 rounded-full bg-emerald-900/30 border-4 border-emerald-500/30 flex items-center justify-center text-6xl mx-auto mb-4">
                                {selectedFarmer?.avatar}
                            </div>
                            <p className="text-white text-xl">{selectedFarmer?.name}</p>
                            <p className="text-emerald-400 text-sm animate-pulse">📹 Demo Video Call</p>
                            <div className="mt-4 p-4 bg-black/50 rounded-lg max-w-sm mx-auto">
                                <p className="text-stone-300 text-sm">
                                    💡 <strong>Tính năng thật đang phát triển!</strong>
                                    <br />
                                    Sẽ tích hợp Daily.co WebRTC để gọi video thật với nông dân.
                                </p>
                            </div>
                        </div>
                    )}
                    {callState === 'ended' && (
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center text-5xl mx-auto mb-4">
                                ✓
                            </div>
                            <p className="text-white">Cuộc gọi kết thúc</p>
                            <p className="text-stone-400 text-sm">Cảm ơn bạn!</p>
                        </div>
                    )}
                </div>

                {/* Local video (self) */}
                <div className="absolute top-4 right-4 w-32 h-44 rounded-lg bg-stone-800 border border-stone-700 overflow-hidden shadow-xl">
                    {isVideoOn ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-800">
                            <User className="w-10 h-10 text-stone-500" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-900">
                            <VideoOff className="w-8 h-8 text-stone-600" />
                        </div>
                    )}
                </div>
            </div>

            {/* Call controls */}
            <div className="p-6 bg-black/80 flex items-center justify-center gap-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500' : 'bg-stone-700 hover:bg-stone-600'
                        }`}
                >
                    {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>

                <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${!isVideoOn ? 'bg-red-500' : 'bg-stone-700 hover:bg-stone-600'
                        }`}
                >
                    {isVideoOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
                </button>

                <button
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                >
                    <PhoneOff className="w-7 h-7 text-white" />
                </button>

                <button
                    className="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
                >
                    <MessageCircle className="w-6 h-6 text-white" />
                </button>
            </div>
        </div>
    )
}

// Export a button that opens the video call modal
export function VideoCallButton({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className={`bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 ${className}`}
            >
                <Video className="w-5 h-5 mr-2" />
                Gọi Video với Nông Dân
            </Button>

            {isOpen && <FarmerVideoCall onClose={() => setIsOpen(false)} />}
        </>
    )
}
