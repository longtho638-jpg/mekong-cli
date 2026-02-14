import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { StructuredData } from "@/components/StructuredData";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Toaster } from "sonner";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: "AGRIOS.tech - Làng Hoa Sa Đéc 2026",
    template: "%s | AGRIOS.tech",
  },
  description: "Nền tảng nông nghiệp thông minh: Khám phá vẻ đẹp hoa xuân miền Tây, quét AR nhận voucher và đặt hoa giá gốc tại vườn.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AGRIOS.tech",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://agrios.tech",
    siteName: "AGRIOS.tech",
    title: "AGRIOS.tech - Nền Tảng Hoa Sa Đéc",
    description: "Trải nghiệm du lịch thực tế ảo, quét AR nhận quà và đặt mua hoa Tết Sa Đéc giá tốt nhất.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Làng hoa Sa Đéc rực rỡ sắc xuân",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AGRIOS.tech - Làng Hoa Sa Đéc",
    description: "Nền tảng nông nghiệp thông minh: Săn hoa, quét AR, nhận quà Tết!",
    images: ["https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200&h=630&fit=crop"],
  },
  other: {
    "tiktok-developers-site-verification": "c0E0ijZDiRb4hadyVk27Fk7qFeUGdppt",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} ${inter.variable}`} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <LanguageProvider>
              <ServiceWorkerRegister />
              {children}
              <StructuredData data={{
                "@type": "SoftwareApplication",
                "name": "AGRIOS - Sa Đéc Flower Hunt 2026",
                "applicationCategory": "TravelApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "VND"
                }
              }} />
              <Toaster />
              <ClientLayoutWrapper />
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
