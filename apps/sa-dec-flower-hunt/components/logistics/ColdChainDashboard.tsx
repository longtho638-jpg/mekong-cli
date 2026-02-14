'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Thermometer, Droplets, MapPin, Battery, Wifi, AlertTriangle, CheckCircle } from 'lucide-react'

interface ColdChainReading {
    id: string
    device_id: string
    temperature: number
    humidity: number
    latitude: number
    longitude: number
    is_alert: boolean
    alert_type: string | null
    recorded_at: string
    iot_devices?: {
        device_id: string
        device_name: string
        manufacturer: string
    }
}

interface ColdChainDashboardProps {
    shipmentId?: string
    deviceId?: string
    refreshInterval?: number // ms
}

export function ColdChainDashboard({
    shipmentId,
    deviceId,
    refreshInterval = 30000
}: ColdChainDashboardProps) {
    const [readings, setReadings] = useState<ColdChainReading[]>([])
    const [stats, setStats] = useState<{
        reading_count: number
        avg_temperature: number | null
        min_temperature: number | null
        max_temperature: number | null
        alerts_count: number
    } | null>(null)
    const [isDemo, setIsDemo] = useState(false)
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const fetchData = async () => {
        try {
            const params = new URLSearchParams()
            if (shipmentId) params.append('shipment_id', shipmentId)
            if (deviceId) params.append('device_id', deviceId)
            params.append('limit', '50')

            const response = await fetch(`/api/cold-chain?${params}`)
            const data = await response.json()

            if (data.success) {
                setReadings(data.data || [])
                setStats(data.stats)
                setIsDemo(data.is_demo || false)
                setLastUpdate(new Date())
            }
        } catch (error) {
            console.error('Cold chain fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, refreshInterval)
        return () => clearInterval(interval)
    }, [shipmentId, deviceId, refreshInterval])

    const latestReading = readings[0]
    const isTemperatureOk = latestReading
        ? latestReading.temperature >= 2 && latestReading.temperature <= 8
        : true

    if (loading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-24 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header với status */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Thermometer className="w-5 h-5" />
                    Cold Chain Monitoring
                </h2>
                <div className="flex items-center gap-2">
                    {isDemo ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            📊 Demo Data
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 animate-pulse">
                            🟢 Live IoT
                        </Badge>
                    )}
                    {lastUpdate && (
                        <span className="text-xs text-gray-500">
                            Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                </div>
            </div>

            {/* Main stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Current Temperature */}
                <Card className={`${isTemperatureOk ? 'border-green-200' : 'border-red-500 border-2 animate-pulse'}`}>
                    <CardContent className="p-4 text-center">
                        <Thermometer className={`w-8 h-8 mx-auto ${isTemperatureOk ? 'text-green-500' : 'text-red-500'}`} />
                        <div className="text-3xl font-bold mt-2">
                            {latestReading?.temperature?.toFixed(1) || '--'}°C
                        </div>
                        <p className="text-xs text-gray-500">Nhiệt độ hiện tại</p>
                        {!isTemperatureOk && (
                            <Badge variant="destructive" className="mt-1">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Ngoài ngưỡng!
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {/* Humidity */}
                <Card>
                    <CardContent className="p-4 text-center">
                        <Droplets className="w-8 h-8 mx-auto text-blue-500" />
                        <div className="text-3xl font-bold mt-2">
                            {latestReading?.humidity || '--'}%
                        </div>
                        <p className="text-xs text-gray-500">Độ ẩm</p>
                    </CardContent>
                </Card>

                {/* Average Temperature */}
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-500">Trung bình</div>
                        <div className="text-2xl font-bold mt-1">
                            {stats?.avg_temperature || '--'}°C
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            Min: {stats?.min_temperature?.toFixed(1)}° / Max: {stats?.max_temperature?.toFixed(1)}°
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts */}
                <Card className={stats?.alerts_count ? 'border-orange-300' : 'border-green-200'}>
                    <CardContent className="p-4 text-center">
                        {stats?.alerts_count ? (
                            <>
                                <AlertTriangle className="w-8 h-8 mx-auto text-orange-500" />
                                <div className="text-3xl font-bold mt-2 text-orange-600">
                                    {stats.alerts_count}
                                </div>
                                <p className="text-xs text-gray-500">Cảnh báo</p>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                                <div className="text-lg font-bold mt-2 text-green-600">
                                    An toàn
                                </div>
                                <p className="text-xs text-gray-500">Không có cảnh báo</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Device info */}
            {latestReading?.iot_devices && (
                <Card className="bg-gray-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{latestReading.iot_devices.device_name}</p>
                                <p className="text-xs text-gray-500">
                                    {latestReading.iot_devices.manufacturer} • ID: {latestReading.iot_devices.device_id}
                                </p>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {latestReading.latitude?.toFixed(4)}, {latestReading.longitude?.toFixed(4)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Battery className="w-4 h-4" />
                                    100%
                                </div>
                                <div className="flex items-center gap-1">
                                    <Wifi className="w-4 h-4" />
                                    Online
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reading history */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Lịch sử đo ({readings.length} bản ghi)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-2 text-left">Thời gian</th>
                                    <th className="p-2 text-center">Nhiệt độ</th>
                                    <th className="p-2 text-center">Độ ẩm</th>
                                    <th className="p-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {readings.slice(0, 20).map((reading) => (
                                    <tr key={reading.id} className={`border-b ${reading.is_alert ? 'bg-red-50' : ''}`}>
                                        <td className="p-2">
                                            {new Date(reading.recorded_at).toLocaleString('vi-VN', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-2 text-center font-mono">
                                            {reading.temperature?.toFixed(1)}°C
                                        </td>
                                        <td className="p-2 text-center font-mono">
                                            {reading.humidity}%
                                        </td>
                                        <td className="p-2 text-center">
                                            {reading.is_alert ? (
                                                <Badge variant="destructive" className="text-xs">
                                                    {reading.alert_type}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs bg-green-100">OK</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Setup guide for demo mode */}
            {isDemo && (
                <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
                    <CardContent className="p-4">
                        <h4 className="font-bold text-blue-800 mb-2">📡 Kết nối thiết bị IoT thực</h4>
                        <p className="text-sm text-blue-700 mb-2">
                            Để hiển thị dữ liệu thực, cấu hình thiết bị gửi POST request đến:
                        </p>
                        <code className="block bg-blue-100 p-2 rounded text-xs font-mono">
                            POST /api/cold-chain
                            {`\n{\n  "device_id": "YOUR_DEVICE_ID",\n  "readings": { "temperature": 4.5, "humidity": 80 },\n  "timestamp": "2025-12-09T09:00:00Z"\n}`}
                        </code>
                        <p className="text-xs text-blue-600 mt-2">
                            Xem hướng dẫn chi tiết: <a href="/docs/COLD_CHAIN_SETUP.md" className="underline">docs/COLD_CHAIN_SETUP.md</a>
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
