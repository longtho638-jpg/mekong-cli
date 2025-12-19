'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const FILES = [
    { id: 1, name: 'Brand Guidelines v2.pdf', type: 'PDF', size: '2.4 MB', date: 'Dec 10, 2024', category: 'Branding' },
    { id: 2, name: 'Logo Package.zip', type: 'ZIP', size: '15.8 MB', date: 'Dec 5, 2024', category: 'Branding' },
    { id: 3, name: 'SEO Audit Report.pdf', type: 'PDF', size: '1.2 MB', date: 'Dec 1, 2024', category: 'Reports' },
    { id: 4, name: 'Social Media Calendar.xlsx', type: 'Excel', size: '450 KB', date: 'Nov 28, 2024', category: 'Planning' },
    { id: 5, name: 'Website Mockups.fig', type: 'Figma', size: '8.3 MB', date: 'Nov 20, 2024', category: 'Design' },
    { id: 6, name: 'Ad Creatives.zip', type: 'ZIP', size: '24.5 MB', date: 'Nov 15, 2024', category: 'Creative' },
    { id: 7, name: 'Content Strategy.pdf', type: 'PDF', size: '980 KB', date: 'Nov 10, 2024', category: 'Strategy' },
    { id: 8, name: 'Monthly Report - Oct.pdf', type: 'PDF', size: '3.1 MB', date: 'Nov 1, 2024', category: 'Reports' },
]

const TYPE_ICONS: Record<string, string> = {
    'PDF': '📄',
    'ZIP': '📦',
    'Excel': '📊',
    'Figma': '🎨',
}

const CATEGORY_COLORS: Record<string, string> = {
    'Branding': 'bg-purple-500/20 text-purple-400',
    'Reports': 'bg-blue-500/20 text-blue-400',
    'Planning': 'bg-green-500/20 text-green-400',
    'Design': 'bg-pink-500/20 text-pink-400',
    'Creative': 'bg-orange-500/20 text-orange-400',
    'Strategy': 'bg-cyan-500/20 text-cyan-400',
}

export default function FilesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900">
            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                            🏢 Client Portal
                        </h1>
                        <p className="text-xs text-gray-500">ABC Corporation</p>
                    </div>
                    <nav className="flex items-center gap-6">
                        <Link href="/client-portal" className="text-gray-400 hover:text-white">Dashboard</Link>
                        <Link href="/client-portal/reports" className="text-gray-400 hover:text-white">Reports</Link>
                        <Link href="/client-portal/projects" className="text-gray-400 hover:text-white">Projects</Link>
                        <Link href="/client-portal/files" className="text-white">Files</Link>
                        <Link href="/client-portal/invoices" className="text-gray-400 hover:text-white">Invoices</Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white">📁 Files</h2>
                        <p className="text-gray-400 mt-1">Download your deliverables and assets</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                </div>

                {/* Files Grid */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700/50 bg-gray-800/30">
                                <th className="text-left p-4 text-gray-400 font-medium">File</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Category</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Size</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                                <th className="text-right p-4 text-gray-400 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FILES.map((file, idx) => (
                                <motion.tr
                                    key={file.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{TYPE_ICONS[file.type] || '📄'}</span>
                                            <div>
                                                <p className="text-white font-medium">{file.name}</p>
                                                <p className="text-gray-500 text-xs">{file.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs ${CATEGORY_COLORS[file.category]}`}>
                                            {file.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">{file.size}</td>
                                    <td className="p-4 text-gray-400 text-sm">{file.date}</td>
                                    <td className="p-4 text-right">
                                        <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors">
                                            ⬇️ Download
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}
