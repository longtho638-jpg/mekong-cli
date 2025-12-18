'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface ProductItem {
    id: string
    name: string
    category: string
    price: number
    stock: number
    status: 'active' | 'draft' | 'out_of_stock'
}

interface OrderItem {
    id: string
    customer: string
    total: number
    items: number
    status: 'pending' | 'processing' | 'shipped' | 'delivered'
}

// Sample data
const PRODUCTS: ProductItem[] = [
    { id: '1', name: 'Wireless Earbuds Pro', category: 'Electronics', price: 99.99, stock: 90, status: 'active' },
    { id: '2', name: 'Phone Case Premium', category: 'Accessories', price: 29.99, stock: 5, status: 'active' },
    { id: '3', name: 'USB-C Hub 7-in-1', category: 'Electronics', price: 59.99, stock: 0, status: 'out_of_stock' },
    { id: '4', name: 'Laptop Stand', category: 'Accessories', price: 49.99, stock: 45, status: 'active' },
]

const ORDERS: OrderItem[] = [
    { id: 'ORD-54821', customer: 'john@example.com', total: 149.98, items: 2, status: 'pending' },
    { id: 'ORD-54820', customer: 'jane@example.com', total: 99.99, items: 1, status: 'processing' },
    { id: 'ORD-54819', customer: 'bob@example.com', total: 209.97, items: 3, status: 'shipped' },
    { id: 'ORD-54818', customer: 'alice@example.com', total: 59.99, items: 1, status: 'delivered' },
]

const STATUS_COLORS = {
    active: '#00ff41',
    draft: '#888',
    out_of_stock: '#ff5f56',
    pending: '#ffd700',
    processing: '#00bfff',
    shipped: '#00ff41',
    delivered: '#888',
}

export default function EcommerceDashboard() {
    const [products] = useState<ProductItem[]>(PRODUCTS)
    const [orders] = useState<OrderItem[]>(ORDERS)

    const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0)
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length
    const pendingOrders = orders.filter(o => o.status === 'pending').length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#00ff41' }}>🛒</span> E-commerce
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Products & Orders</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#00ff41' },
                        { label: 'Total Stock', value: totalStock, color: '#00bfff' },
                        { label: 'Low Stock', value: lowStock, color: '#ffd700' },
                        { label: 'Pending', value: pendingOrders, color: '#ff5f56' },
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
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Products */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PRODUCT CATALOG</h3>

                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[product.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{product.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{product.category}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[product.status]}20`,
                                        color: STATUS_COLORS[product.status],
                                    }}>
                                        {product.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#00ff41' }}>${product.price}</span>
                                    <span style={{ color: product.stock <= 10 ? '#ffd700' : '#888' }}>📦 {product.stock} in stock</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Orders */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>ORDER PIPELINE</h3>

                        {orders.map((order, i) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[order.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{order.id}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[order.status]}20`,
                                        color: STATUS_COLORS[order.status],
                                    }}>
                                        {order.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>{order.customer}</span>
                                    <span style={{ color: '#00ff41' }}>${order.total.toFixed(2)} ({order.items} items)</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
