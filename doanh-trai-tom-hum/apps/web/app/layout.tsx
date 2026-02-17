import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "LOBSTER EMPIRE | ROI as a Service",
    description:
        "🦞 Doanh Trại Tôm Hùm — Automated ROI Generation Platform for 2026. Build. Deploy. Profit.",
    keywords: ["RaaS", "ROI", "automation", "AI", "agents", "2026"],
    authors: [{ name: "OpenClaw" }],
    openGraph: {
        title: "LOBSTER EMPIRE | ROI as a Service",
        description: "Automated ROI Generation Platform for 2026",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-cyber-bg antialiased">
                {children}
            </body>
        </html>
    );
}
