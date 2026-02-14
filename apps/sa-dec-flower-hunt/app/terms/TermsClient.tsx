"use client";

import Link from 'next/link'
import { withI18n, WithI18nProps } from "@/lib/withI18n";

function TermsPage({ texts }: WithI18nProps) {
    return (
        <div className="min-h-screen bg-stone-950 py-20 px-6 relative font-sans">
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-10" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>
            <div className="max-w-3xl mx-auto relative z-10">
                <Link href="/" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
                    ← {texts["back"]}
                </Link>

                <h1 className="text-4xl font-bold text-white mb-8">{texts["title"]}</h1>
                <p className="text-stone-400 mb-8">{texts["updated"]}</p>

                <div className="prose prose-invert prose-emerald max-w-none space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec1.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec1.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec2.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec2.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec3.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec3.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec4.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec4.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec5.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec5.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec6.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec6.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec7.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec7.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec8.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec8.desc"]}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default withI18n(TermsPage, "terms");
