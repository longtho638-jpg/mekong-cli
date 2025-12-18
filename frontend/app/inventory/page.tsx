'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface InventoryItem {
    id: string
    name: string
    sku: string
    category: string
    quantity: number
    reorderLevel: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
    value: number
}

interface Warehouse {
    id: string
    name: string
    location: string
    capacity: number
    used: number
    items: number
}

interface Movement {
    id: string
    type: 'inbound' | 'outbound' | 'transfer'
    item: string
    quantity: number
    date: string
}

// Sample data
const INVENTORY: InventoryItem[] = [
    { id: '1', name: 'AgencyOS License Keys', sku: 'AOS-LIC-001', category: 'Software', quantity: 500, reorderLevel: 100, status: 'in_stock', value: 499500 },
    { id: '2', name: 'Training Materials', sku: 'TRN-MAT-001', category: 'Education', quantity: 45, reorderLevel: 50, status: 'low_stock', value: 13500 },
    { id: '3', name: 'Hardware Bundles', sku: 'HW-BND-001', category: 'Hardware', quantity: 0, reorderLevel: 10, status: 'out_of_stock', value: 0 },
    { id: '4', name: 'Consulting Credits', sku: 'CON-CRD-001', category: 'Service', quantity: 250, reorderLevel: 50, status: 'in_stock', value: 62500 },
]

const WAREHOUSES: Warehouse[] = [
    { id: '1', name: 'Digital Vault', location: 'Cloud', capacity: 10000, used: 7500, items: 3 },
    { id: '2', name: 'Saigon Hub', location: 'Ho Chi Minh', capacity: 500, used: 120, items: 8 },
    { id: '3', name: 'Mekong Storage', location: 'Can Tho', capacity: 200, used: 45, items: 5 },
]

const MOVEMENTS: Movement[] = [
    { id: '1', type: 'inbound', item: 'AgencyOS License Keys', quantity: 100, date: 'Today' },
    { id: '2', type: 'outbound', item: 'Training Materials', quantity: 15, date: 'Yesterday' },
    { id: '3', type: 'transfer', item: 'Consulting Credits', quantity: 25, date: 'Dec 15' },
]

const STATUS_COLORS: Record<string, string> = {
    in_stock: '#00ff41',
    low_stock: '#ffd700',
    out_of_stock: '#ff0000',
}

const TYPE_COLORS: Record<string, string> = {
    inbound: '#00ff41',
    outbound: '#ff6347',
    transfer: '#00bfff',
}

export default function InventoryHubPage() {
    const [inventory] = useState(INVENTORY)
    const [warehouses] = useState(WAREHOUSES)
    const [movements] = useState(MOVEMENTS)

    // Metrics
    const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0)
    const totalValue = inventory.reduce((sum, i) => sum + i.value, 0)
    const lowStockItems = inventory.filter(i => i.status === 'low_stock').length
    const outOfStock = inventory.filter(i => i.status === 'out_of_stock').length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            {/* Ambient */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,165,0,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#ffa500' }}>📦</span> Inventory Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Stock • Warehouses • Movements</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Items', value: totalItems.toLocaleString(), color: '#00ff41' },
                        { label: 'Total Value', value: `$${(totalValue / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Low Stock', value: lowStockItems, color: '#ffd700' },
                        { label: 'Out of Stock', value: outOfStock, color: '#ff0000' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Inventory */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,165,0,0.2)',
                        borderTop: '3px solid #ffa500',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ffa500' }}>📦 Stock Levels</h3>

                        {inventory.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[item.status]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{item.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{item.sku} • {item.category}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: STATUS_COLORS[item.status] }}>
                                            {item.quantity}
                                        </p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[item.status]}20`,
                                            color: STATUS_COLORS[item.status],
                                        }}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Warehouses + Movements */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Warehouses */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00bfff' }}>🏭 Warehouses</h3>

                            {warehouses.map((wh, i) => (
                                <div key={wh.id} style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.85rem' }}>{wh.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#888' }}>{wh.location}</span>
                                    </div>
                                    <div style={{
                                        height: 6,
                                        background: '#333',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${(wh.used / wh.capacity) * 100}%`,
                                            height: '100%',
                                            background: (wh.used / wh.capacity) > 0.9 ? '#ff6347' : (wh.used / wh.capacity) > 0.7 ? '#ffd700' : '#00ff41',
                                        }} />
                                    </div>
                                    <p style={{ color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                        {wh.used}/{wh.capacity} slots • {wh.items} items
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Movements */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>🔄 Recent Movements</h3>

                            {movements.map((mv, i) => (
                                <div
                                    key={mv.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < movements.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{mv.item}</p>
                                        <span style={{
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            fontSize: '0.55rem',
                                            background: `${TYPE_COLORS[mv.type]}20`,
                                            color: TYPE_COLORS[mv.type],
                                        }}>
                                            {mv.type}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: TYPE_COLORS[mv.type], fontSize: '0.9rem' }}>
                                            {mv.type === 'inbound' ? '+' : mv.type === 'outbound' ? '-' : '↔'}{mv.quantity}
                                        </p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{mv.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Inventory Excellence
                </footer>
            </div>
        </div>
    )
}
