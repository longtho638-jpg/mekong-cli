import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mekong Marketing - Nhượng quyền Marketing Hub tự động",
  description: "Mở Agency Marketing tại tỉnh lẻ Việt Nam chỉ trong 15 phút. AI Video tự động, chi phí tối ưu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
