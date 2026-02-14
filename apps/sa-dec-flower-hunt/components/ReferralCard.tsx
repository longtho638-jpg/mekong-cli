"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Copy, Gift, Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import confetti from "canvas-confetti"
import { supabase } from "@/lib/supabase"

export function ReferralCard() {
    const [copied, setCopied] = useState(false)
    const [referralCode, setReferralCode] = useState("")
    const [referralCount, setReferralCount] = useState(0)

    useEffect(() => {
        // 1. Get or create userId
        let userId = localStorage.getItem("agrios_user_id");
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem("agrios_user_id", userId!);
        }

        // 2. Generate deterministic code from userId (simplified)
        const code = "TET-" + userId!.slice(0, 6).toUpperCase();
        setReferralCode(code);

        // 3. Fetch count
        fetchReferralCount(userId!);

        if (!supabase) return;

        // 4. Realtime subscription for this referrer
        const channel = supabase
            .channel('referral_updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'referrals', filter: `referrer_id=eq.${userId}` },
                () => {
                    setReferralCount(prev => prev + 1);
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, []);

    const fetchReferralCount = async (userId: string) => {
        if (!supabase) return;
        const { count, error } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId);

        if (!error && count !== null) {
            setReferralCount(count);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://agrios.tech?ref=${referralCode}`)
        setCopied(true)

        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#EC4899', '#EAB308']
        })

        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Tặng bạn 50k mua hoa Tết! 🌸',
                    text: 'Nhận ngay voucher 50k khi đặt hoa Sa Đéc tại đây:',
                    url: `https://agrios.tech?ref=${referralCode}`,
                })
            } catch (error) {
                console.log('Error sharing', error)
            }
        } else {
            handleCopy()
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-md mt-6"
        >
            <div className="relative">
                {/* Gift Card Visual */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl transform rotate-1 opacity-20 blur-lg"></div>

                <Card className="relative border-0 overflow-hidden bg-gradient-to-br from-white to-pink-50 dark:from-stone-900 dark:to-stone-900 border-pink-100 dark:border-pink-900/30 shadow-xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-200 to-transparent rounded-bl-full opacity-50"></div>

                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center shrink-0">
                                <Gift className="w-6 h-6 text-pink-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-stone-900 dark:text-white">Tặng bạn bè 50K 🎁</h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    {referralCount > 0
                                        ? <span>Đã giới thiệu <strong className="text-pink-600">{referralCount}</strong> bạn!</span>
                                        : "Bạn cũng sẽ nhận được 30K!"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-stone-800 rounded-xl p-3 border border-pink-100 dark:border-stone-700 flex items-center justify-between gap-2 mb-4">
                            <code className="font-mono font-bold text-pink-600 text-lg tracking-wider">
                                {referralCode || "..."}
                            </code>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCopy}
                                className="hover:bg-pink-50 hover:text-pink-600"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold h-12 shadow-lg shadow-pink-200 dark:shadow-none"
                            onClick={handleShare}
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Chia Sẻ Ngay
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    )
}
