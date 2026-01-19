import type { ReactNode } from 'react';

export default function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'vi' },
    { locale: 'zh' },
  ];
}

