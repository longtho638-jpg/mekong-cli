'use client'

import { useEffect, useState, useCallback } from 'react'
import { DailyProvider, useDaily, useLocalSessionId, useParticipantIds, useVideoTrack, useAudioTrack, DailyVideo } from '@daily-co/daily-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    Phone,
    Loader2,
    Users,
    Clock,
    MessageCircle
} from 'lucide-react'

interface DailyVideoRoomProps {
    roomUrl: string
    userName: string
    onLeave?: () => void
    onError?: (error: Error) => void
}

// Video tile component for each participant
function VideoTile({ sessionId, isLocal }: { sessionId: string, isLocal?: boolean }) {
    const videoTrack = useVideoTrack(sessionId)
    const audioTrack = useAudioTrack(sessionId)

    return (
        <div className={`relative rounded-xl overflow-hidden bg-stone-900 ${isLocal ? 'w-40 h-56' : 'w-full h-full'}`}>
            {videoTrack?.state === 'playable' ? (
                <DailyVideo
                    sessionId={sessionId}
                    type="video"
                    className="w-full h-full object-cover"
                    mirror={isLocal}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900">
                    <div className="w-20 h-20 rounded-full bg-stone-700 flex items-center justify-center">
                        <Users className="w-10 h-10 text-stone-500" />
                    </div>
                </div>
            )}

            {/* Audio indicator */}
            {audioTrack?.state === 'off' && (
                <div className="absolute bottom-2 left-2 bg-red-500/80 rounded-full p-1">
                    <MicOff className="w-3 h-3 text-white" />
                </div>
            )}

            {/* Label */}
            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                {isLocal ? 'Bạn' : 'Nông dân'}
            </div>
        </div>
    )
}

// Main call interface
function CallInterface({ onLeave }: { onLeave?: () => void }) {
    const daily = useDaily()
    const localSessionId = useLocalSessionId()
    const participantIds = useParticipantIds({ filter: 'remote' })

    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [callState, setCallState] = useState<'joining' | 'joined' | 'error'>('joining')

    // Call duration timer
    useEffect(() => {
        if (callState !== 'joined') return
        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [callState])

    // Track join state
    useEffect(() => {
        if (!daily) return

        const handleJoined = () => setCallState('joined')
        const handleError = () => setCallState('error')

        daily.on('joined-meeting', handleJoined)
        daily.on('error', handleError)

        return () => {
            daily.off('joined-meeting', handleJoined)
            daily.off('error', handleError)
        }
    }, [daily])

    const toggleMute = useCallback(() => {
        if (daily) {
            daily.setLocalAudio(!isMuted)
            setIsMuted(!isMuted)
        }
    }, [daily, isMuted])

    const toggleVideo = useCallback(() => {
        if (daily) {
            daily.setLocalVideo(isVideoOff)
            setIsVideoOff(!isVideoOff)
        }
    }, [daily, isVideoOff])

    const leaveCall = useCallback(() => {
        if (daily) {
            daily.leave()
        }
        onLeave?.()
    }, [daily, onLeave])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (callState === 'joining') {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Đang kết nối...</p>
                    <p className="text-stone-400 text-sm">Vui lòng cho phép truy cập camera và micro</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 z-10">
                <div className="flex items-center gap-4">
                    <Badge className="bg-emerald-500 text-white">
                        🔴 Live
                    </Badge>
                    <div className="flex items-center gap-2 text-white">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{formatDuration(callDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-400">
                        <Users className="w-4 h-4" />
                        <span>{participantIds.length + 1} người</span>
                    </div>
                </div>
            </div>

            {/* Video area */}
            <div className="flex-1 relative p-4">
                {/* Remote participant (farmer) - full screen */}
                {participantIds.length > 0 ? (
                    <div className="w-full h-full">
                        <VideoTile sessionId={participantIds[0]} />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-900 rounded-xl">
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-4">
                                <Phone className="w-10 h-10 text-stone-500" />
                            </div>
                            <p className="text-white text-lg">Đang chờ nông dân tham gia...</p>
                            <p className="text-stone-400 text-sm mt-2">Chia sẻ link phòng cho nông dân</p>
                        </div>
                    </div>
                )}

                {/* Local video (self) - picture in picture */}
                {localSessionId && (
                    <div className="absolute top-4 right-4 shadow-2xl border-2 border-stone-700 rounded-xl overflow-hidden">
                        <VideoTile sessionId={localSessionId} isLocal />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-black/80 flex items-center justify-center gap-4">
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-stone-700 hover:bg-stone-600'
                        }`}
                >
                    {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-stone-700 hover:bg-stone-600'
                        }`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </button>

                <button
                    onClick={leaveCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/25"
                >
                    <PhoneOff className="w-7 h-7 text-white" />
                </button>

                <button
                    className="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-all"
                >
                    <MessageCircle className="w-6 h-6 text-white" />
                </button>
            </div>
        </div>
    )
}

// Main wrapper component with DailyProvider
export function DailyVideoRoom({ roomUrl, userName, onLeave, onError }: DailyVideoRoomProps) {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        // Dynamically import Daily to avoid SSR issues
        import('@daily-co/daily-js').then((DailyIframe) => {
            setIsReady(true)
        }).catch((err) => {
            console.error('Failed to load Daily.co SDK:', err)
            onError?.(err)
        })
    }, [onError])

    if (!isReady) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        )
    }

    return (
        <DailyProvider
            url={roomUrl}
            userName={userName}
        >
            <CallInterface onLeave={onLeave} />
        </DailyProvider>
    )
}

// Button to start a new video call
export function StartVideoCallButton({
    farmerId,
    farmerName,
    buyerName = 'Khách hàng',
    className
}: {
    farmerId: string
    farmerName?: string
    buyerName?: string
    className?: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [roomUrl, setRoomUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const startCall = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/video-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farmerId, farmerName, buyerName })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create room')
            }

            setRoomUrl(data.room.url)
        } catch (err: unknown) {
            console.error('Failed to start call:', err)
            setError('Không thể tạo cuộc gọi. Vui lòng thử lại.')
        } finally {
            setIsLoading(false)
        }
    }

    const endCall = () => {
        setRoomUrl(null)
    }

    if (roomUrl) {
        return (
            <DailyVideoRoom
                roomUrl={roomUrl}
                userName={buyerName}
                onLeave={endCall}
                onError={() => {
                    setError('Lỗi kết nối. Vui lòng thử lại.')
                    setRoomUrl(null)
                }}
            />
        )
    }

    return (
        <div>
            <Button
                onClick={startCall}
                disabled={isLoading}
                className={`bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 ${className}`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang tạo phòng...
                    </>
                ) : (
                    <>
                        <Video className="w-5 h-5 mr-2" />
                        Gọi Video với {farmerName || 'Nông Dân'}
                    </>
                )}
            </Button>
            {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
        </div>
    )
}
