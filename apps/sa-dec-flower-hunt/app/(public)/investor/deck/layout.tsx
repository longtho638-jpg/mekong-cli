import { SlideNavigation } from "@/components/investor/SlideNavigation";
import { ReactNode } from "react";

export default function InvestorDeckLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img src="/assets/digital-twins/agrios_lab_hyperreal_1765368168487.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-black/80" />
            </div>

            {/* Slide Content */}
            <main className="relative z-10">
                {children}
            </main>

            {/* Navigation */}
            <SlideNavigation />
        </div>
    );
}
