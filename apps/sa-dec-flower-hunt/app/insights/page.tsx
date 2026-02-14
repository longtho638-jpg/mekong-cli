'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Calendar,
    Tag,
    ArrowRight,
    Search,
    TrendingUp,
    BookOpen,
    Clock,
    Sparkles
} from 'lucide-react'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BlogPost {
    id: string
    title: string
    content: string
    hashtags: string[]
    created_at: string
    status: string
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    useEffect(() => {
        async function fetchPosts() {
            const { data, error } = await supabase
                .from('content_queue')
                .select('*')
                .eq('type', 'blog')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(20)

            if (!error && data) {
                setPosts(data)
            }
            setLoading(false)
        }

        fetchPosts()
    }, [])

    // Get all unique tags
    const allTags = Array.from(new Set(posts.flatMap(p => p.hashtags || [])))

    // Filter posts
    const filteredPosts = posts.filter(post => {
        const matchesSearch = searchQuery === '' ||
            post.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTag = selectedTag === null ||
            (post.hashtags && post.hashtags.includes(selectedTag))
        return matchesSearch && matchesTag
    })

    // Parse blog content from JSON
    const parseBlogContent = (content: string) => {
        try {
            const parsed = JSON.parse(content)
            return {
                title: parsed.title || 'Untitled',
                slug: parsed.slug || '',
                meta_description: parsed.meta_description || '',
                keywords: parsed.keywords || [],
                body: parsed.content || ''
            }
        } catch {
            return {
                title: 'Blog Post',
                slug: '',
                meta_description: '',
                keywords: [],
                body: content
            }
        }
    }

    return (
        <div className="min-h-screen bg-stone-950 text-white relative">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-15" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="relative py-20 px-6 overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
                    </div>

                    <div className="relative max-w-5xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
                        >
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-sm">Kiến thức hoa từ nông dân</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                        >
                            Blog <span className="text-emerald-400">Hoa Tết</span> 2026
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-stone-400 max-w-2xl mx-auto mb-10"
                        >
                            Hướng dẫn chọn hoa, chăm sóc, và bí quyết từ nông dân làng hoa Sa Đéc
                        </motion.p>

                        {/* Search */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="max-w-xl mx-auto relative"
                        >
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm bài viết..."
                                className="w-full pl-12 pr-4 py-4 bg-stone-800/50 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                        </motion.div>
                    </div>
                </section>

                {/* Tags */}
                <section className="px-6 pb-8 border-b border-stone-800">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 hide-scrollbar">
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${selectedTag === null
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                    }`}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Tất cả
                            </button>
                            {allTags.slice(0, 10).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${selectedTag === tag
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                        }`}
                                >
                                    <Tag className="w-4 h-4" />
                                    {tag.replace('#', '')}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Blog Posts Grid */}
                <section className="py-12 px-6">
                    <div className="max-w-5xl mx-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="text-center py-20">
                                <Sparkles className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                                <h3 className="text-xl text-stone-400 mb-2">Chưa có bài viết</h3>
                                <p className="text-stone-500">Các bài viết SEO sẽ được tạo tự động hàng ngày</p>
                                <Link
                                    href="/api/agents/growth?agent=all"
                                    className="inline-flex items-center gap-2 mt-4 text-emerald-400 hover:text-emerald-300"
                                >
                                    Chạy agent tạo content ngay
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPosts.map((post, i) => {
                                    const parsed = parseBlogContent(post.content)
                                    return (
                                        <motion.article
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="group bg-stone-900/50 border border-stone-800 rounded-2xl overflow-hidden hover:border-stone-700 transition-all"
                                        >
                                            {/* Thumbnail placeholder */}
                                            <div className="h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                                <span className="text-4xl">🌸</span>
                                            </div>

                                            <div className="p-5">
                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {(post.hashtags || []).slice(0, 2).map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Title */}
                                                <h2 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                                                    {parsed.title || post.title}
                                                </h2>

                                                {/* Description */}
                                                <p className="text-stone-400 text-sm mb-4 line-clamp-2">
                                                    {parsed.meta_description || 'Bài viết về hoa và cách chăm sóc...'}
                                                </p>

                                                {/* Meta */}
                                                <div className="flex items-center justify-between text-xs text-stone-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        5 phút đọc
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Read more */}
                                            <Link
                                                href={`/blog/${parsed.slug || post.id}`}
                                                className="block p-4 border-t border-stone-800 text-center text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                            >
                                                <span className="flex items-center justify-center gap-2">
                                                    Đọc tiếp
                                                    <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </Link>
                                        </motion.article>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-6 border-t border-stone-800">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Nhận hoa tươi từ Sa Đéc
                        </h2>
                        <p className="text-stone-400 mb-8">
                            Giao trong 6 giờ, cold-chain đảm bảo, trực tiếp từ nông dân
                        </p>
                        <Link
                            href="/founding"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all"
                        >
                            Nhận hoa FREE (Founding 10)
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    )
}
