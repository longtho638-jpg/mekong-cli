import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_URL = 'https://api.daily.co/v1'

// POST: Create a new room for video call
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { farmerId, farmerName, buyerName } = body

        if (!DAILY_API_KEY) {
            console.log('[Daily.co] No API key configured, using demo mode')
            return NextResponse.json({
                success: true,
                demo: true,
                room: {
                    name: `demo-room-${Date.now()}`,
                    url: `https://sadec.daily.co/demo-room`,
                    created_at: new Date().toISOString()
                },
                message: 'Demo mode - API key not configured'
            })
        }

        // Create unique room name
        const roomName = `farmer-${farmerId}-${Date.now()}`

        // Create room via Daily.co REST API
        const response = await fetch(`${DAILY_API_URL}/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`
            },
            body: JSON.stringify({
                name: roomName,
                properties: {
                    // Room expires in 1 hour
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    // Video settings
                    enable_prejoin_ui: true,
                    enable_screenshare: true,
                    enable_chat: true,
                    // Permissions
                    start_video_off: false,
                    start_audio_off: false,
                    // Max 2 participants (farmer + buyer)
                    max_participants: 2
                }
            })
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('[Daily.co] Create room failed:', error)
            return NextResponse.json(
                { error: 'Không thể tạo phòng video call', details: error },
                { status: response.status }
            )
        }

        const room = await response.json()
        console.log(`[Daily.co] Room created: ${room.url}`)

        return NextResponse.json({
            success: true,
            room: {
                name: room.name,
                url: room.url,
                created_at: room.created_at,
                config: room.config
            }
        })

    } catch (error: unknown) {
        console.error('[Daily.co] Error:', error)
        return NextResponse.json(
            { error: 'Lỗi tạo phòng video call' },
            { status: 500 }
        )
    }
}

// GET: Get room info or list active rooms
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const roomName = searchParams.get('room')

    if (!DAILY_API_KEY) {
        return NextResponse.json({
            success: true,
            demo: true,
            message: 'Demo mode - Cấu hình DAILY_API_KEY để sử dụng thật'
        })
    }

    try {
        if (roomName) {
            // Get specific room
            const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
                headers: {
                    'Authorization': `Bearer ${DAILY_API_KEY}`
                }
            })

            if (!response.ok) {
                return NextResponse.json(
                    { error: 'Room not found' },
                    { status: 404 }
                )
            }

            const room = await response.json()
            return NextResponse.json({ success: true, room })
        }

        // List all rooms
        const response = await fetch(`${DAILY_API_URL}/rooms`, {
            headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`
            }
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch rooms' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json({
            success: true,
            rooms: data.data,
            total: data.total_count
        })

    } catch (error: unknown) {
        console.error('[Daily.co] Error:', error)
        return NextResponse.json(
            { error: 'Lỗi lấy thông tin phòng' },
            { status: 500 }
        )
    }
}

// DELETE: Delete a room
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const roomName = searchParams.get('room')

    if (!roomName) {
        return NextResponse.json(
            { error: 'Room name required' },
            { status: 400 }
        )
    }

    if (!DAILY_API_KEY) {
        return NextResponse.json({ success: true, demo: true })
    }

    try {
        const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`
            }
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to delete room' },
                { status: response.status }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Room ${roomName} deleted`
        })

    } catch (error: unknown) {
        console.error('[Daily.co] Delete error:', error)
        return NextResponse.json(
            { error: 'Lỗi xóa phòng' },
            { status: 500 }
        )
    }
}
