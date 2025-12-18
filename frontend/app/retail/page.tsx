'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Product {
    id: string
    name: string
    category: string
    price: number
    stock: number
    sold: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

interface Order {
    id: string
    customer: string
    items: number
    total: number
    status: 'pending' | 'processing' | 'shipped' | 'delivered'
    date: string
}

interface Store {
    id: string
    name: string
    location: string
    revenue: number
    transactions: number
}

// Sample data
const PRODUCTS: Product[] = [
    { id: '1', name: 'AgencyOS Pro License', category: 'Software', price: 999, stock: 100, sold: 450, status: 'in_stock' },
    { id: '2', name: 'Binh Phap Strategy Course', category: 'Education', price: 299, stock: 5, sold: 125, status: 'low_stock' },
    { id: '3', name: 'Mekong Consulting Package', category: 'Service', price: 2500, stock: 20, sold: 35, status: 'in_stock' },
]

const ORDERS: Order[] = [
    { id: 'ORD-001', customer: 'Mekong Corp', items: 5, total: 4995, status: 'shipped', date: 'Today' },
    { id: 'ORD-002', customer: 'Saigon Tech', items: 2, total: 1998, status: 'processing', date: 'Yesterday' },
    { id: 'ORD-003', customer: 'Delta Farms', items: 1, total: 2500, status: 'pending', date: 'Dec 15' },
]

const STORES: Store[] = [
    { id: '1', name: 'Online Store', location: 'Global', revenue: 125000, transactions: 850 },
    { id: '2', name: 'Saigon Showroom', location: 'Ho Chi Minh', revenue: 45000, transactions: 120 },
    { id: '3', name: 'Mekong Pop-up', location: 'Can Tho', revenue: 18000, transactions: 45 },
]

const STATUS_COLORS: Record<string, string> = {
    in_stock: '#00ff41',
    low_stock: '#ffd700',
    out_of_stock: '#ff0000',
    pending: '#ffd700',
    processing: '#00bfff',
    shipped: '#8a2be2',
    delivered: '#00ff41',
}

export default function RetailHubPage() {
    const [products] = useState(PRODUCTS)
    const [orders] = useState(ORDERS)
    const [stores] = useState(STORES)

    // Metrics
    const totalRevenue = stores.reduce((sum, s) => sum + s.revenue, 0)
    const totalOrders = orders.length
    const totalProducts = products.reduce((sum, p) => sum + p.sold, 0)
    const avgOrderValue = orders.reduce((sum, o) => sum + o.total, 0) / orders.length

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
                left: '40%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,105,180,0.06) 0%, transparent 60%)',
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
                        <span style={{ color: '#ff69b4' }}>🏪</span> Retail Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Products • Orders • Stores</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, color: '#00ff41' },
                        { label: 'Orders', value: totalOrders, color: '#00bfff' },
                        { label: 'Products Sold', value: totalProducts, color: '#ff69b4' },
                        { label: 'Avg Order', value: `$${avgOrderValue.toFixed(0)}`, color: '#ffd700' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Products */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,105,180,0.2)',
                        borderTop: '3px solid #ff69b4',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ff69b4' }}>📦 Top Products</h3>

                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{product.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{product.category}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#00ff41', fontSize: '1rem' }}>${product.price}</p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[product.status]}20`,
                                            color: STATUS_COLORS[product.status],
                                        }}>
                                            {product.stock} in stock
                                        </span>
                                    </div>
                                </div>
                                <p style={{ color: '#ffd700', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                    🔥 {product.sold} sold
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Orders + Stores */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Recent Orders */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00bfff' }}>🛒 Recent Orders</h3>

                            {orders.map((order, i) => (
                                <div
                                    key={order.id}
                                    style={{
                                        padding: '0.5rem 0',
                                        borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '0.85rem' }}>{order.customer}</p>
                                            <p style={{ color: '#888', fontSize: '0.7rem' }}>{order.id} • {order.items} items</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ color: '#00ff41', fontSize: '0.85rem' }}>${order.total}</p>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                fontSize: '0.6rem',
                                                background: `${STATUS_COLORS[order.status]}20`,
                                                color: STATUS_COLORS[order.status],
                                            }}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stores */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>🏬 Store Performance</h3>

                            {stores.map((store, i) => (
                                <div
                                    key={store.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < stores.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{store.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{store.location}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#00ff41', fontSize: '0.85rem' }}>${(store.revenue / 1000).toFixed(0)}K</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{store.transactions} txns</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Retail Excellence
                </footer>
            </div>
        </div>
    )
}
