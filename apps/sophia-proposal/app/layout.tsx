import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LazyMotionProvider } from "./components/providers/LazyMotionProvider";

const inter = Geist({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Geist_Mono({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Video Factory - Nền Tảng Video AI + Affiliate Marketing",
  description: "Tự động sản xuất video, phân phối đa kênh, thu nhập thụ động với OpenClaw + n8n + AI Tools",
  keywords: ["AI Video", "Affiliate Marketing", "OpenClaw", "n8n", "Automation", "Passive Income"],
  authors: [{ name: "AgencyOS" }],
  openGraph: {
    title: "AI Video Factory - Nền Tảng Video AI + Affiliate Marketing",
    description: "Tự động sản xuất video, phân phối đa kênh, thu nhập thụ động",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <LazyMotionProvider>
          {children}
        </LazyMotionProvider>
      </body>
    </html>
  );
}
