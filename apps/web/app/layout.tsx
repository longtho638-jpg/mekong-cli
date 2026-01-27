import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import "../styles/rtl.css"; // Import RTL styles
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "AgencyOS - AI-Powered Agency Management",
  description: "IPO-ready agency management platform with Binh Pháp strategic framework. Automate your agency, optimize revenue, and scale with AI.",
  keywords: ["agency management", "AI automation", "startup growth", "revenue optimization", "marketing automation"],
  openGraph: {
    title: "AgencyOS - AI-Powered Agency Management",
    description: "IPO-ready agency management platform with Binh Pháp strategic framework.",
    url: "https://agencyos.ai",
    siteName: "AgencyOS",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "AgencyOS Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgencyOS - AI-Powered Agency Management",
    description: "IPO-ready agency management platform with Binh Pháp strategic framework.",
    creator: "@agencyos",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const RTL_LOCALES = ['ar-SA', 'he-IL'];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Try to detect language from cookies server-side to prevent hydration mismatch on html attrs
  const cookieStore = await cookies();
  const lang = cookieStore.get('i18next')?.value || 'en-US';
  const dir = RTL_LOCALES.includes(lang) ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir}>
      <body className="antialiased">
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}
