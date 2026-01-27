import * as React from 'react';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SaaS Admin Dashboard Pro',
  description: 'Premium Admin Dashboard for SaaS applications',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
