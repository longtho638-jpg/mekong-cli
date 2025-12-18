'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Listing {
    id: string
    title: string
    type: 'sale' | 'rent'
    property_type: string
    price: number
    location: string
    status: 'active' | 'pending' | 'sold'
}

interface PortfolioAsset {
    id: string
    name: string
    class: string
    purchase_value: number
    current_value: number
    roi: number
}

interface Lead {
    id: string
    name: string
    intent: 'buy' | 'sell' | 'rent'
    budget: number
    location: string
    status: 'new' | 'qualified' | 'negotiating'
}

// Sample data
const LISTINGS: Listing[] = [
    { id: '1', title: 'Villa D2 Premium', type: 'sale', property_type: 'Villa', price: 2500000, location: 'District 2', status: 'active' },
    { id: '2', title: 'Penthouse Sky View', type: 'sale', property_type: 'Apartment', price: 1800000, location: 'District 1', status: 'pending' },
    { id: '3', title: 'Office Space CBD', type: 'rent', property_type: 'Commercial', price: 15000, location: 'District 1', status: 'active' },
]

const PORTFOLIO: PortfolioAsset[] = [
    { id: '1', name: 'Office Tower A', class: 'Commercial', purchase_value: 5000000, current_value: 6500000, roi: 30 },
    { id: '2', name: 'Residential Complex', class: 'Multi-family', purchase_value: 3000000, current_value: 3800000, roi: 26.7 },
]

const LEADS: Lead[] = [
    { id: '1', name: 'Nguyen Van A', intent: 'buy', budget: 500000, location: 'District 7', status: 'qualified' },
    { id: '2', name: 'Tran B', intent: 'rent', budget: 2000, location: 'District 2', status: 'new' },
    { id: '3', name: 'Le C Corp', intent: 'buy', budget: 2000000, location: 'District 1', status: 'negotiating' },
]

export default function RealEstateHubPage() {
    const [listings] = useState(LISTINGS)
    const [portfolio] = useState(PORTFOLIO)
    const [leads] = useState(LEADS)

    // Metrics
    const totalListingValue = listings.reduce((sum, l) => sum + l.price, 0)
    const portfolioValue = portfolio.reduce((sum, p) => sum + p.current_value, 0)
    const avgROI = portfolio.reduce((sum, p) => sum + p.roi, 0) / portfolio.length
    const pipelineValue = leads.reduce((sum, l) => sum + l.budget, 0)

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
                        <span style={{ color: '#ffa500' }}>🏠</span> Real Estate Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Listings • Portfolio • Leads</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Listing Value', value: `$${(totalListingValue / 1000000).toFixed(1)}M`, color: '#ffa500' },
                        { label: 'Portfolio Value', value: `$${(portfolioValue / 1000000).toFixed(1)}M`, color: '#00ff41' },
                        { label: 'Avg ROI', value: `${avgROI.toFixed(1)}%`, color: '#00bfff' },
                        { label: 'Pipeline', value: `$${(pipelineValue / 1000000).toFixed(1)}M`, color: '#ffd700' },
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

                    {/* Listings */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,165,0,0.2)',
                        borderTop: '3px solid #ffa500',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ffa500' }}>📋 Active Listings</h3>

                        {listings.map((listing, i) => (
                            <motion.div
                                key={listing.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{listing.title}</p>
                                    <p style={{ color: '#888', fontSize: '0.75rem' }}>{listing.property_type} • {listing.location}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#00ff41', fontWeight: 'bold' }}>
                                        ${listing.type === 'rent' ? `${listing.price.toLocaleString()}/mo` : listing.price.toLocaleString()}
                                    </p>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: listing.status === 'active' ? 'rgba(0,255,65,0.1)' : 'rgba(255,215,0,0.1)',
                                        color: listing.status === 'active' ? '#00ff41' : '#ffd700',
                                    }}>
                                        {listing.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Portfolio + Leads */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Portfolio */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>🏢 Portfolio</h3>

                            {portfolio.map((asset, i) => (
                                <div
                                    key={asset.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < portfolio.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{asset.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{asset.class}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#00ff41', fontSize: '0.85rem' }}>+{asset.roi}%</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>${(asset.current_value / 1000000).toFixed(1)}M</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Leads */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00bfff' }}>📋 Hot Leads</h3>

                            {leads.map((lead, i) => (
                                <div
                                    key={lead.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{lead.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{lead.intent} • {lead.location}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#ffd700', fontSize: '0.85rem' }}>${lead.budget >= 1000000 ? `${(lead.budget / 1000000).toFixed(1)}M` : lead.budget.toLocaleString()}</p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '8px',
                                            fontSize: '0.6rem',
                                            background: lead.status === 'negotiating' ? 'rgba(0,255,65,0.1)' : 'rgba(0,191,255,0.1)',
                                            color: lead.status === 'negotiating' ? '#00ff41' : '#00bfff',
                                        }}>
                                            {lead.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Real Estate Excellence
                </footer>
            </div>
        </div>
    )
}
