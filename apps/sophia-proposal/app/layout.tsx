import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LazyMotionProvider } from "./components/providers/LazyMotionProvider";

const inter = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
  weight: "100 900",
});

const spaceGrotesk = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-space",
  weight: "100 900",
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
