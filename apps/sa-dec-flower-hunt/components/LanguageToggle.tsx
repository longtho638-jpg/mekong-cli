"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import { Globe } from "lucide-react"

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage()

    return (
        <div className="flex items-center bg-black/50 border border-emerald-500/30 rounded-full p-0.5 backdrop-blur-md">
            <button
                onClick={() => setLanguage("vi")}
                className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all duration-300 ${language === "vi"
                        ? "bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : "text-stone-500 hover:text-emerald-400"
                    }`}
            >
                VIE
            </button>
            <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all duration-300 ${language === "en"
                        ? "bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : "text-stone-500 hover:text-emerald-400"
                    }`}
            >
                ENG
            </button>
        </div>
    )
}
