"use client";

import { useState } from "react";
import { Facebook, Link as LinkIcon, Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareButtonProps {
    url: string;
    title: string;
    description?: string;
    image?: string;
}

export function ShareButton({ url, title, description, image }: ShareButtonProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareToFacebook = () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        trackShare('facebook');
    };

    const shareToZalo = () => {
        // Zalo share URL format
        const zaloUrl = `https://sp.zalo.me/share_inline?u=${encodeURIComponent(url)}`;
        window.open(zaloUrl, '_blank', 'width=600,height=400');
        trackShare('zalo');
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            trackShare('copy_link');
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const trackShare = async (platform: string) => {
        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_name: 'product_shared',
                    properties: {
                        platform,
                        url,
                        title,
                    },
                }),
            });
        } catch (error) {
            console.error('Analytics error:', error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-sm text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Chia sẻ</span>
            </button>

            <AnimatePresence>
                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />

                        {/* Share menu */}
                        <motion.div
                            className="absolute top-full right-0 mt-2 bg-stone-900 border border-stone-800 rounded-sm p-4 shadow-xl z-50 min-w-[200px]"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="space-y-2">
                                {/* Facebook */}
                                <button
                                    onClick={shareToFacebook}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-500/20 rounded text-left transition-colors group"
                                >
                                    <Facebook className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm text-white group-hover:text-blue-400">Facebook</span>
                                </button>

                                {/* Zalo */}
                                <button
                                    onClick={shareToZalo}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sky-500/20 rounded text-left transition-colors group"
                                >
                                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">Z</span>
                                    </div>
                                    <span className="text-sm text-white group-hover:text-sky-400">Zalo</span>
                                </button>

                                {/* Copy link */}
                                <button
                                    onClick={copyLink}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-500/20 rounded text-left transition-colors group"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-5 h-5 text-emerald-500" />
                                            <span className="text-sm text-emerald-400">Đã sao chép!</span>
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="w-5 h-5 text-stone-400 group-hover:text-emerald-400" />
                                            <span className="text-sm text-white group-hover:text-emerald-400">Sao chép link</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
