'use client'

import { useState } from 'react'
import { VideoHeroSection } from '@/components/marketing/VideoHeroSection'
import { FarmerVideoCall } from '@/components/video/FarmerVideoCall'
import { LiveCounters } from '@/components/marketing/LiveCounters'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { ComparisonTable } from '@/components/marketing/ComparisonTable'
import { FAQSection } from '@/components/marketing/FAQSection'
import { LeadWizard } from '@/components/marketing/LeadWizard'
import { FloatingAgentButton } from '@/components/marketing/FloatingAgentButton'
import { LiveTicker } from '@/components/ui/live-ticker'

export default function VideoLandingPage() {
    const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
    const [isLeadWizardOpen, setIsLeadWizardOpen] = useState(false)

    return (
        <div className="min-h-screen bg-black text-white relative">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>

            <div className="relative z-10">
                <LiveTicker />

                {/* Video Hero Section */}
                <VideoHeroSection
                    onCallFarmer={() => setIsVideoCallOpen(true)}
                    onBuyNow={() => setIsLeadWizardOpen(true)}
                />

                {/* Live Counters */}
                <section className="py-16 bg-gradient-to-b from-black to-stone-900">
                    <div className="container mx-auto px-6">
                        <LiveCounters />
                    </div>
                </section>

                {/* Why Different Section */}
                <section className="py-20 bg-stone-900">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                            Tại sao mua hoa ở đây <span className="text-emerald-400">khác biệt?</span>
                        </h2>
                        <p className="text-center text-stone-400 mb-12 max-w-2xl mx-auto">
                            Không giống TikTok Live - chúng tôi cam kết chất lượng bằng công nghệ Cold Chain và traceability
                        </p>
                        <ComparisonTable />
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-20 bg-black">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            Khách hàng nói gì?
                        </h2>
                        <TestimonialsSection />
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-20 bg-stone-900">
                    <div className="container mx-auto px-6">
                        <FAQSection />
                    </div>
                </section>

                {/* CTA Footer */}
                <section className="py-16 bg-gradient-to-r from-emerald-900 to-green-800">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Sẵn sàng nhận hoa tươi nhất miền Tây?
                        </h2>
                        <p className="text-emerald-100 mb-8">
                            Gọi video trực tiếp với nông dân để chọn hoa theo ý bạn
                        </p>
                        <button
                            onClick={() => setIsVideoCallOpen(true)}
                            className="bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 rounded-xl font-bold text-lg shadow-lg"
                        >
                            🎥 Gọi Video với Nông Dân ngay
                        </button>
                    </div>
                </section>

                {/* Floating Agent */}
                <FloatingAgentButton />

                {/* Modals */}
                {isVideoCallOpen && (
                    <FarmerVideoCall onClose={() => setIsVideoCallOpen(false)} />
                )}

                <LeadWizard
                    isOpen={isLeadWizardOpen}
                    onClose={() => setIsLeadWizardOpen(false)}
                />
            </div>
        </div>
    )
}
