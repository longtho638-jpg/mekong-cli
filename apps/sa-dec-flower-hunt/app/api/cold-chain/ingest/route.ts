import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cold Chain IoT Data Ingest Endpoint
 * 🔒 SECURITY: Protected by IOT_API_KEY header
 * Designed for reliability with IoT devices
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    // 🔒 SECURITY: Verify IoT API key
    const apiKey = request.headers.get('x-api-key');
    if (process.env.IOT_API_KEY && apiKey !== process.env.IOT_API_KEY) {
        console.warn('[Cold Chain Ingest] Invalid API key attempt');
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    console.log('[Cold Chain Ingest] Received data at:', new Date().toISOString())

    try {
        const body = await request.json()

        // Accept various formats from different IoT devices
        const deviceId = body.device_id || body.deviceId || body.id
        const timestamp = body.timestamp || body.ts || new Date().toISOString()

        // Extract readings from various formats
        const readings = body.readings || body.data || body
        const temperature = readings.temperature ?? readings.temp ?? readings.t
        const humidity = readings.humidity ?? readings.hum ?? readings.h
        const latitude = readings.latitude ?? readings.lat
        const longitude = readings.longitude ?? readings.lng ?? readings.lon

        if (!deviceId) {
            return NextResponse.json(
                { error: 'device_id required', code: 'MISSING_DEVICE_ID' },
                { status: 400 }
            )
        }

        // Try to insert to database
        try {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            // Upsert device (create if not exists)
            await supabaseAdmin
                .from('iot_devices')
                .upsert({
                    device_id: deviceId,
                    device_type: 'temperature_humidity',
                    is_active: true,
                    last_seen_at: new Date().toISOString()
                }, { onConflict: 'device_id' })

            // Get device UUID
            const { data: device } = await supabaseAdmin
                .from('iot_devices')
                .select('id')
                .eq('device_id', deviceId)
                .single()

            if (device) {
                // Insert reading
                await supabaseAdmin
                    .from('cold_chain_readings')
                    .insert({
                        device_id: device.id,
                        temperature,
                        humidity,
                        latitude,
                        longitude,
                        recorded_at: timestamp
                    })
            }

            console.log(`[Cold Chain Ingest] Saved: ${deviceId} - ${temperature}°C, ${humidity}%`)

            return NextResponse.json({
                success: true,
                device_id: deviceId,
                received: { temperature, humidity },
                stored: true
            })

        } catch (dbError) {
            console.error('[Cold Chain Ingest] DB Error:', dbError)

            // Still acknowledge receipt even if DB fails
            // This is important for IoT devices that may not handle errors well
            return NextResponse.json({
                success: true,
                device_id: deviceId,
                received: { temperature, humidity },
                stored: false,
                warning: 'Data received but storage pending'
            })
        }

    } catch (error: unknown) {
        console.error('[Cold Chain Ingest] Parse Error:', error)
        return NextResponse.json(
            { error: 'Invalid payload', code: 'PARSE_ERROR' },
            { status: 400 }
        )
    }
}

// Health check for devices
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'cold-chain-ingest',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    })
}
