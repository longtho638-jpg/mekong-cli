'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface ProductItem {
    id: string
    asin: string
    name: string
    units: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
    fbaFee: number
    storageFee: number
}

interface PPCItem {
    id: string
    name: string
    type: 'sp' | 'sb' | 'sd'
    budget: number
    spend: number
    sales: number
    acos: number
}

// Sample data
const PRODUCTS: ProductItem[] = [
    { id: '1', asin: 'B08N5WRWNW', name: 'Wireless Earbuds Pro', units: 450, status: 'in_stock', fbaFee: 5.99, storageFee: 1.25 },
    { id: '2', asin: 'B09XR3WMXP', name: 'Phone Stand Aluminum', units: 35, status: 'low_stock', fbaFee: 3.45, storageFee: 0.85 },
    { id: '3', asin: 'B07D7P4SY', name: 'USB-C Hub 7-in-1', units: 0, status: 'out_of_stock', fbaFee: 4.50, storageFee: 1.10 },
    { id: '4', asin: 'B08K3QYRXN', name: 'Laptop Sleeve 15"', units: 280, status: 'in_stock', fbaFee: 6.25, storageFee: 1.50 },
]

const PPC_CAMPAIGNS: PPCItem[] = [
    { id: '1', name: 'Earbuds - Exact', type: 'sp', budget: 100, spend: 850, sales: 3200, acos: 26.5 },
    { id: '2', name: 'Phone Stand - Auto', type: 'sp', budget: 50, spend: 420, sales: 1850, acos: 22.7 },
    { id: '3', name: 'Brand Awareness', type: 'sb', budget: 75, spend: 580, sales: 2100, acos: 27.6 },
]

const STATUS_COLORS = {
    in_stock: '#00ff41',
    low_stock: '#ffd700',
    out_of_stock: '#ff5f56',
}

const TYPE_COLORS = {
    sp: '#ff9900',
    sb: '#146eb4',
    sd: '#00bfff',
}

export default function AmazonFBADashboard() {
    const [products] = useState<ProductItem[]>(PRODUCTS)
    const [ppcCampaigns] = useState<PPCItem[]>(PPC_CAMPAIGNS)

    const totalUnits = products.reduce((sum, p) => sum + p.units, 0)
    const lowStock = products.filter(p => p.status !== 'in_stock').length
    const totalSpend = ppcCampaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalSales = ppcCampaigns.reduce((sum, c) => sum + c.sales, 0)
    const avgACOS = ppcCampaigns.reduce((sum, c) => sum + c.acos, 0) / ppcCampaigns.length

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
                        <span style={{ color: '#ff9900' }}>📦</span> Amazon FBA
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Inventory & PPC Management</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Units', value: totalUnits.toLocaleString(), color: '#00ff41' },
                        { label: 'Alerts', value: lowStock, color: '#ffd700' },
                        { label: 'PPC Sales', value: `$${(totalSales / 1000).toFixed(1)}K`, color: '#ff9900' },
                        { label: 'Avg ACOS', value: `${avgACOS.toFixed(1)}%`, color: '#00bfff' },
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

                    {/* Inventory */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>FBA INVENTORY</h3>

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
                                        <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{product.asin}</span>
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
                                    <span style={{ color: '#00ff41' }}>📦 {product.units} units</span>
                                    <span style={{ color: '#888' }}>FBA: ${product.fbaFee}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* PPC Campaigns */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PPC CAMPAIGNS</h3>

                        {ppcCampaigns.map((campaign, i) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[campaign.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{campaign.name}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${TYPE_COLORS[campaign.type]}20`,
                                        color: TYPE_COLORS[campaign.type],
                                    }}>
                                        {campaign.type.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>💸 ${campaign.spend}</span>
                                    <span style={{ color: '#ff9900' }}>💰 ${campaign.sales}</span>
                                    <span style={{ color: campaign.acos <= 25 ? '#00ff41' : '#ffd700' }}>📊 {campaign.acos}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
