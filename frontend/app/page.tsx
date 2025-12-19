'use client'

import { Navigation } from '@/components/sections/Navigation'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { BinhPhap } from '@/components/sections/BinhPhap'
import { Testimonials } from '@/components/sections/Testimonials'
import { CTA } from '@/components/sections/CTA'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-x-hidden font-sans">
            <Navigation />
            <Hero />
            <Features />
            <BinhPhap />
            <Testimonials />
            <CTA />
            <Footer />
        </main>
    )
}
