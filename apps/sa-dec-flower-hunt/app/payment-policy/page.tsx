"use client";

// ============================================================================
// PAYMENT POLICY PAGE - Vietnam Legal Compliance
// ============================================================================

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CreditCard, RefreshCw, Gift, AlertCircle, CheckCircle2, Phone } from 'lucide-react'

import { withI18n, WithI18nProps } from "@/lib/withI18n";

// ... (imports)

function PaymentPolicyPage({ texts }: WithI18nProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 py-20 px-6 relative font-sans">
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-10" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>
            <div className="max-w-3xl mx-auto relative z-10">
                <Link href="/" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-flex items-center gap-2 group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    {texts["back"]}
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                        {texts["pay.title"]}
                    </h1>
                    <p className="text-stone-400 mb-8">{texts["updated"]}</p>

                    {/* Quick Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                        <QuickCard
                            icon={<CreditCard className="w-5 h-5" />}
                            title={texts["pay.card1.title"]}
                            desc={texts["pay.card1.desc"]}
                        />
                        <QuickCard
                            icon={<RefreshCw className="w-5 h-5" />}
                            title={texts["pay.card2.title"]}
                            desc={texts["pay.card2.desc"]}
                        />
                        <QuickCard
                            icon={<Gift className="w-5 h-5" />}
                            title={texts["pay.card3.title"]}
                            desc={texts["pay.card3.desc"]}
                        />
                    </div>

                    <div className="prose prose-invert prose-emerald max-w-none space-y-8">

                        {/* Payment Methods */}
                        <Section title={texts["pay.sec1.title"]} icon={<CreditCard />}>
                            <p className="text-stone-300">
                                {texts["pay.sec1.desc"]}
                            </p>
                            <ul className="list-disc pl-6 text-stone-300 space-y-2">
                                <li><strong>PayOS</strong> - Chuyển khoản ngân hàng QR (Napas 247)</li>
                                <li><strong>VNPay</strong> - Thẻ ATM nội địa, Visa, Mastercard</li>
                                <li><strong>COD</strong> - Thanh toán khi nhận hàng (chỉ nội thành)</li>
                            </ul>
                            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 mt-4">
                                <p className="text-emerald-300 text-sm flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>Tất cả giá niêm yết đã <strong>bao gồm VAT 10%</strong> theo quy định pháp luật Việt Nam.</span>
                                </p>
                            </div>
                        </Section>

                        {/* SaaS Subscription */}
                        <Section title={texts["pay.sec2.title"]} icon={<CreditCard />}>
                            <p className="text-stone-300 mb-4">{texts["pay.sec2.desc"]}</p>
                            <div className="bg-stone-800/50 rounded-xl p-4">
                                <table className="w-full text-stone-300 text-sm">
                                    <thead>
                                        <tr className="border-b border-stone-700">
                                            <th className="text-left py-2">Gói</th>
                                            <th className="text-right py-2">Giá/tháng</th>
                                            <th className="text-right py-2">Chu kỳ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-stone-700/50">
                                            <td className="py-2">Free Tier</td>
                                            <td className="text-right text-emerald-400">0đ</td>
                                            <td className="text-right">Không hạn</td>
                                        </tr>
                                        <tr className="border-b border-stone-700/50">
                                            <td className="py-2">Pro (đề xuất)</td>
                                            <td className="text-right text-emerald-400">499.000đ</td>
                                            <td className="text-right">Hàng tháng</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2">Enterprise</td>
                                            <td className="text-right text-emerald-400">Liên hệ</td>
                                            <td className="text-right">Hàng năm</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        {/* Vouchers */}
                        <Section title={texts["pay.sec3.title"]} icon={<Gift />}>
                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 mb-4">
                                <p className="text-amber-300 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{texts["pay.sec3.warning"]}</span>
                                </p>
                            </div>
                        </Section>

                        {/* Refunds */}
                        <Section title={texts["pay.sec4.title"]} icon={<RefreshCw />}>
                            <p className="text-stone-300 mb-4">
                                {texts["pay.sec4.desc"]}
                            </p>
                            <div className="space-y-3">
                                <RefundCase
                                    case="Hoa héo/hư khi nhận"
                                    result="Hoàn 100% trong 24h"
                                    success
                                />
                                <RefundCase
                                    case="Giao sai sản phẩm"
                                    result="Hoàn 100% + đổi mới"
                                    success
                                />
                                <RefundCase
                                    case="Hủy trước khi giao"
                                    result="Hoàn 100%"
                                    success
                                />
                                <RefundCase
                                    case="Đổi ý sau khi nhận"
                                    result="Không hoàn tiền"
                                    success={false}
                                />
                                <RefundCase
                                    case="Hoa đúng nhưng không thích"
                                    result="Không hoàn tiền"
                                    success={false}
                                />
                            </div>
                        </Section>

                        {/* Dispute */}
                        <Section title={texts["pay.sec5.title"]} icon={<AlertCircle />}>
                            <p className="text-stone-300">
                                {texts["pay.sec5.desc"]}
                            </p>
                            <div className="bg-stone-800/50 rounded-xl p-4 mt-4 space-y-2">
                                <p className="text-stone-300 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-emerald-400" />
                                    <strong>Hotline:</strong> 1900-AGRIOS (24/7)
                                </p>
                                <p className="text-stone-300">
                                    📧 <strong>Email:</strong> support@agrios.tech
                                </p>
                                <p className="text-stone-300">
                                    📍 <strong>Địa chỉ:</strong> Sa Đéc, Đồng Tháp, Việt Nam
                                </p>
                            </div>
                        </Section>

                        {/* Legal */}
                        <section className="border-t border-stone-700 pt-8">
                            <p className="text-stone-500 text-sm">
                                {texts["pay.footer"]}
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default withI18n(PaymentPolicyPage, "payment_policy");

// Quick Card Component
function QuickCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4 text-center">
            <div className="text-emerald-400 flex justify-center mb-2">{icon}</div>
            <div className="text-white font-semibold text-sm">{title}</div>
            <div className="text-stone-500 text-xs">{desc}</div>
        </div>
    )
}

// Section Component
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="text-emerald-400">{icon}</span>
                {title}
            </h2>
            {children}
        </section>
    )
}

// Refund Case Component  
function RefundCase({ case: caseDesc, result, success }: { case: string; result: string; success: boolean }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg ${success ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
            <span className="text-stone-300">{caseDesc}</span>
            <span className={`text-sm font-medium ${success ? 'text-emerald-400' : 'text-red-400'}`}>
                {success ? '✓' : '✕'} {result}
            </span>
        </div>
    )
}
