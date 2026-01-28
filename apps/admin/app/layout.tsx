import '../globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AdminLayout from '@/components/layout';
import QueryProvider from '@/components/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgencyOS Admin',
  description: 'Admin Dashboard for AgencyOS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AdminLayout>
            {children}
          </AdminLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
