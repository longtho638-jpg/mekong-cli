"use client";

import { AdminTerminalHUD } from "@/components/admin/AdminTerminalHUD";

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 relative">
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_lab_hyperreal_1765368168487.png" className="w-full h-full object-cover opacity-15" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>

            <div className="relative z-10 w-full">
                {/* Terminal HUD Header */}
                <AdminTerminalHUD />

                {/* Main Content Area */}
                <main className="w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
