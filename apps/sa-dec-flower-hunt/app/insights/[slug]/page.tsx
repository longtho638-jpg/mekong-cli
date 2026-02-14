'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Calendar,
    Clock,
    ArrowLeft,
    Share2,
    BookOpen,
    Tag,
    ChevronRight
} from 'lucide-react'

interface BlogPostData {
    title: string
    slug: string
    meta_description: string
    keywords: string[]
    content: string
    structured_data: object
    created_at: string
}

export default function BlogPostPage() {
    const params = useParams()
    const slug = params.slug as string

    const [post, setPost] = useState<BlogPostData | null>(null)
    const [loading, setLoading] = useState(true)
    const [relatedPosts, setRelatedPosts] = useState<{ id: string; title: string }[]>([])

    useEffect(() => {
        async function fetchPost() {
            if (!supabase) {
                setLoading(false);
                return;
            }

            // Try to find by slug in content
            const { data, error } = await supabase
                .from('content_queue')
                .select('*')
                .eq('type', 'blog')
                .order('created_at', { ascending: false })

            if (!error && data) {
                // Find the post with matching slug
                for (const item of data) {
                    try {
                        const parsed = JSON.parse(item.content)
                        if (parsed.slug === slug || item.id === slug) {
                            setPost({
                                ...parsed,
                                created_at: item.created_at
                            })
                            break
                        }
                    } catch {
                        if (item.id === slug) {
                            setPost({
                                title: item.title || 'Blog Post',
                                slug: item.id,
                                meta_description: '',
                                keywords: item.hashtags || [],
                                content: item.content,
                                structured_data: {},
                                created_at: item.created_at
                            })
                            break
                        }
                    }
                }

                // Get related posts
                setRelatedPosts(
                    data
                        .filter(d => d.id !== slug)
                        .slice(0, 3)
                        .map(d => {
                            try {
                                const parsed = JSON.parse(d.content)
                                return { id: parsed.slug || d.id, title: parsed.title || d.title }
                            } catch {
                                return { id: d.id, title: d.title || 'Blog Post' }
                            }
                        })
                )
            }

            setLoading(false)
        }

        fetchPost()
    }, [slug])

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: post?.title,
                text: post?.meta_description,
                url: window.location.href
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Đã copy link!')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-white mb-4">Không tìm thấy bài viết</h1>
                    <Link href="/blog" className="text-emerald-400 hover:text-emerald-300">
                        ← Quay lại Blog
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(post.structured_data || {
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: post.title,
                        description: post.meta_description
                    })
                }}
            />

            {/* Header */}
            <header className="border-b border-stone-800 py-4 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/blog"
                        className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Blog
                    </Link>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        Chia sẻ
                    </button>
                </div>
            </header>

            {/* Article */}
            <article className="py-12 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <motion.nav
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-sm text-stone-500 mb-8"
                    >
                        <Link href="/" className="hover:text-white">Trang chủ</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/blog" className="hover:text-white">Blog</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-stone-300 truncate max-w-[200px]">{post.title}</span>
                    </motion.nav>

                    {/* Meta */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 text-stone-500 mb-6"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.created_at).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            5 phút đọc
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            AGRIOS.tech
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
                    >
                        {post.title}
                    </motion.h1>

                    {/* Description */}
                    {post.meta_description && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-stone-400 mb-8 leading-relaxed"
                        >
                            {post.meta_description}
                        </motion.p>
                    )}

                    {/* Keywords/Tags */}
                    {post.keywords && post.keywords.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-2 mb-10"
                        >
                            {post.keywords.map(keyword => (
                                <span
                                    key={keyword}
                                    className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm"
                                >
                                    <Tag className="w-3 h-3" />
                                    {keyword}
                                </span>
                            ))}
                        </motion.div>
                    )}

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="prose prose-lg prose-invert prose-emerald max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(post.content) }}
                    />

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl text-center"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4">
                            Muốn nhận hoa tươi từ Sa Đéc?
                        </h3>
                        <p className="text-stone-400 mb-6">
                            Giao trong 6 giờ, cold-chain đảm bảo, trực tiếp từ nông dân
                        </p>
                        <Link
                            href="/founding"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                        >
                            Nhận hoa FREE (Founding 10)
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="py-12 px-6 border-t border-stone-800">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">Bài viết liên quan</h2>
                        <div className="grid gap-4">
                            {relatedPosts.map(related => (
                                <Link
                                    key={related.id}
                                    href={`/blog/${related.id}`}
                                    className="flex items-center gap-4 p-4 bg-stone-900/50 border border-stone-800 rounded-xl hover:border-stone-700 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                                        🌸
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium line-clamp-1">{related.title}</h3>
                                        <p className="text-stone-500 text-sm">Hoa Tết 2026</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-stone-500" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}

// 🔒 SECURITY: Escape HTML to prevent XSS
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 🔒 SECURITY: Validate URL is safe (internal only or trusted domains)
function isSafeUrl(url: string): boolean {
    // Allow internal links
    if (url.startsWith('/') && !url.startsWith('//')) return true;
    // Allow specific trusted domains
    if (url.startsWith('https://agrios.tech')) return true;
    if (url.startsWith('https://sadec.vn')) return true;
    return false;
}

// Simple markdown to HTML converter (🔒 XSS-Safe)
function formatMarkdown(content: string): string {
    if (!content) return ''

    // 🔒 SECURITY: First escape all HTML to prevent injection
    let safe = escapeHtml(content);

    return safe
        // Headers (safe - $1 is already escaped)
        .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-white mt-8 mb-4">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-10 mb-4">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-white mt-10 mb-6">$1</h1>')
        // Bold (safe - content escaped)
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^- (.+)$/gm, '<li class="ml-4 text-stone-300">$1</li>')
        .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc my-4">$&</ul>')
        // Blockquotes
        .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 my-4 text-stone-400 italic">$1</blockquote>')
        // 🔒 Links - ONLY allow internal links (starting with /)
        .replace(/\[(.+?)\]\((\/.+?)\)/g, (match, text, url) => {
            if (isSafeUrl(url)) {
                return `<a href="${url}" class="text-emerald-400 hover:text-emerald-300 underline">${text}</a>`;
            }
            return text; // Strip unsafe links, keep text only
        })
        // Paragraphs
        .replace(/^(?!<[a-z])(.*\S.*)$/gm, '<p class="text-stone-300 my-4 leading-relaxed">$1</p>')
        // Tables
        .replace(/\|(.+)\|/g, '<tr><td class="border border-stone-700 px-4 py-2 text-stone-300">$1</td></tr>')
        // Line breaks (escaped --- becomes safe)
        .replace(/---/g, '<hr class="border-stone-700 my-8" />')
}
