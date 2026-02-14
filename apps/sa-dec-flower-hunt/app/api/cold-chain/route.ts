import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy init to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null
function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!url || !key) {
            throw new Error('Supabase env vars not configured')
        }
        supabaseAdmin = createClient(url, key)
    }
    return supabaseAdmin
}

interface SensorReading {
    device_id: string
    shipment_id?: string
    readings: {
        temperature?: number
        humidity?: number
        latitude?: number
        longitude?: number
        altitude?: number
        battery_level?: number
        signal_strength?: number
    }
    timestamp: string
}

// GET: Lấy dữ liệu cold chain theo shipment hoặc device
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipment_id')
    const deviceId = searchParams.get('device_id')
    const limit = parseInt(searchParams.get('limit') || '100')

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        let query = supabase
            .from('cold_chain_readings')
            .select(`
        *,
        iot_devices (device_id, device_name, manufacturer),
        cold_chain_shipments (shipment_code, status, min_temp, max_temp)
      `)
            .order('recorded_at', { ascending: false })
            .limit(limit)

        if (shipmentId) {
            query = query.eq('shipment_id', shipmentId)
        }
        if (deviceId) {
            query = query.eq('device_id', deviceId)
        }

        const { data: readings, error } = await query

        if (error) throw error

        // Calculate stats
        const temps = readings?.filter(r => r.temperature !== null).map(r => r.temperature) || []
        const stats = {
            reading_count: readings?.length || 0,
            avg_temperature: temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null,
            min_temperature: temps.length ? Math.min(...temps) : null,
            max_temperature: temps.length ? Math.max(...temps) : null,
            alerts_count: readings?.filter(r => r.is_alert).length || 0
        }

        return NextResponse.json({
            success: true,
            data: readings,
            stats,
            is_live: readings && readings.length > 0 && !readings[0].device_id?.includes('DEMO')
        })

    } catch (error: unknown) {
        console.error('Cold chain read error:', error)

        // Demo fallback data
        const demoReadings = generateDemoReadings()

        return NextResponse.json({
            success: true,
            data: demoReadings,
            stats: {
                reading_count: demoReadings.length,
                avg_temperature: 4.2,
                min_temperature: 3.1,
                max_temperature: 5.8,
                alerts_count: 1
            },
            is_demo: true,
            message: 'Hiển thị dữ liệu demo - Kết nối thiết bị IoT để xem dữ liệu thực'
        })
    }
}

// POST: Nhận dữ liệu từ thiết bị IoT (Webhook endpoint)
export async function POST(request: NextRequest) {
    try {
        const body: SensorReading = await request.json()

        // Validate required fields
        if (!body.device_id || !body.readings || !body.timestamp) {
            return NextResponse.json(
                { error: 'Thiếu trường bắt buộc: device_id, readings, timestamp' },
                { status: 400 }
            )
        }

        // Find or verify device
        const { data: device, error: deviceError } = await getSupabaseAdmin()
            .from('iot_devices')
            .select('id, is_active')
            .eq('device_id', body.device_id)
            .single()

        if (deviceError || !device) {
            // Auto-register new device
            const { data: newDevice, error: createError } = await getSupabaseAdmin()
                .from('iot_devices')
                .insert({
                    device_id: body.device_id,
                    device_type: 'temperature_humidity',
                    device_name: `Auto-registered: ${body.device_id}`,
                    is_active: true,
                    last_seen_at: new Date().toISOString()
                })
                .select('id')
                .single()

            if (createError) {
                console.error('Device registration failed:', createError)
                return NextResponse.json(
                    { error: 'Không thể đăng ký thiết bị mới' },
                    { status: 500 }
                )
            }

            console.log(`New device registered: ${body.device_id}`)
        }

        // Get device UUID
        const { data: deviceData } = await getSupabaseAdmin()
            .from('iot_devices')
            .select('id')
            .eq('device_id', body.device_id)
            .single()

        // Check for temperature violations
        const temp = body.readings.temperature
        const humidity = body.readings.humidity
        let isAlert = false
        let alertType = null

        // Get shipment thresholds if shipment_id provided
        let shipmentUuid = null
        if (body.shipment_id) {
            const { data: shipment } = await getSupabaseAdmin()
                .from('cold_chain_shipments')
                .select('id, min_temp, max_temp, min_humidity, max_humidity')
                .eq('shipment_code', body.shipment_id)
                .single()

            if (shipment) {
                shipmentUuid = shipment.id

                if (temp !== undefined) {
                    if (temp < shipment.min_temp) {
                        isAlert = true
                        alertType = 'temperature_low'
                    } else if (temp > shipment.max_temp) {
                        isAlert = true
                        alertType = 'temperature_high'
                    }
                }

                if (humidity !== undefined) {
                    if (humidity < shipment.min_humidity) {
                        isAlert = true
                        alertType = 'humidity_low'
                    } else if (humidity > shipment.max_humidity) {
                        isAlert = true
                        alertType = 'humidity_high'
                    }
                }
            }
        }

        // Insert reading
        const { data: reading, error: insertError } = await getSupabaseAdmin()
            .from('cold_chain_readings')
            .insert({
                device_id: deviceData?.id,
                shipment_id: shipmentUuid,
                temperature: body.readings.temperature,
                humidity: body.readings.humidity,
                latitude: body.readings.latitude,
                longitude: body.readings.longitude,
                altitude: body.readings.altitude,
                battery_level: body.readings.battery_level,
                signal_strength: body.readings.signal_strength,
                is_alert: isAlert,
                alert_type: alertType,
                recorded_at: body.timestamp
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Reading insert failed:', insertError)
            return NextResponse.json(
                { error: 'Lưu dữ liệu thất bại' },
                { status: 500 }
            )
        }

        // Create alert if threshold violated
        if (isAlert && shipmentUuid) {
            await getSupabaseAdmin()
                .from('cold_chain_alerts')
                .insert({
                    shipment_id: shipmentUuid,
                    reading_id: reading.id,
                    alert_type: alertType,
                    severity: alertType?.includes('temperature') ? 'critical' : 'warning',
                    message: `Vi phạm ${alertType}: ${alertType?.includes('temperature') ? temp + '°C' : humidity + '%'}`,
                    actual_value: alertType?.includes('temperature') ? temp : humidity
                })
        }

        // Update device last_seen
        await getSupabaseAdmin()
            .from('iot_devices')
            .update({
                last_seen_at: new Date().toISOString(),
                battery_level: body.readings.battery_level
            })
            .eq('device_id', body.device_id)

        return NextResponse.json({
            success: true,
            reading_id: reading.id,
            alert_triggered: isAlert,
            message: isAlert
                ? `⚠️ CẢNH BÁO: ${alertType}`
                : '✅ Dữ liệu đã lưu thành công'
        })

    } catch (error: unknown) {
        console.error('Cold chain ingest error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý dữ liệu từ thiết bị' },
            { status: 500 }
        )
    }
}

// Generate demo readings for display
function generateDemoReadings() {
    const now = new Date()
    const readings = []

    // Generate 24 hours of demo data (every 30 mins)
    for (let i = 0; i < 48; i++) {
        const time = new Date(now.getTime() - i * 30 * 60 * 1000)
        const baseTemp = 4.0
        const variation = Math.sin(i / 6) * 1.5 + (Math.random() - 0.5)
        const temp = baseTemp + variation

        readings.push({
            id: `demo-${i}`,
            device_id: 'DEMO_SENSOR_001',
            temperature: parseFloat(temp.toFixed(1)),
            humidity: 75 + Math.floor(Math.random() * 15),
            latitude: 10.2899 + (Math.random() - 0.5) * 0.1,
            longitude: 105.7231 + (Math.random() - 0.5) * 0.1,
            is_alert: temp > 7 || temp < 2,
            alert_type: temp > 7 ? 'temperature_high' : (temp < 2 ? 'temperature_low' : null),
            recorded_at: time.toISOString(),
            iot_devices: {
                device_id: 'DEMO_SENSOR_001',
                device_name: 'Demo Cold Chain Sensor',
                manufacturer: 'ESP32-DIY'
            }
        })
    }

    return readings
}
