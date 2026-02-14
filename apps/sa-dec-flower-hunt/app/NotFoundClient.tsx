"use client";

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'
import { withI18n, WithI18nProps } from "@/lib/withI18n";

function NotFoundPage({ texts }: WithI18nProps) {
    return (
        <div className="min-h-screen bg-stone-950 text-white relative flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-stone-950/80" />
            </div>

            <div className="relative z-10 text-center max-w-md mx-auto">
                <h1 className="text-9xl font-bold text-emerald-500/20 mb-4">{texts["title"]}</h1>
                <h2 className="text-3xl font-bold text-white mb-4">{texts["heading"]}</h2>
                <p className="text-stone-400 mb-8">
                    {texts["desc"]}
                </p>

                <div className="flex flex-col gap-3">
                    <Link href="/">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-lg">
                            <Home className="mr-2 h-4 w-4" /> {texts["home_btn"]}
                        </Button>
                    </Link>
                    <Link href="/search">
                        <Button variant="outline" className="w-full h-12 text-lg">
                            <Search className="mr-2 h-4 w-4" /> {texts["search_btn"]}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default withI18n(NotFoundPage, "not_found");
