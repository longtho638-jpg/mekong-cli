import type { Metadata } from "next";
import "../globals.css";
import { NotificationsDemo } from "@/components/NotificationsDemo";
import { ResponsiveLayout } from "@/components/layouts/ResponsiveLayout";

export const metadata: Metadata = {
    title: "Sa Đéc Flower Hunt 2026",
    description: "Khám phá vẻ đẹp hoa xuân miền Tây",
};

export default function ShopLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative min-h-screen bg-black">
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_market_hyperreal_1765367298057.png" className="w-full h-full object-cover opacity-15" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>
            <div className="relative z-10">
                <ResponsiveLayout>
                    <NotificationsDemo />
                    {children}
                </ResponsiveLayout>
            </div>
        </div>
    );
}
