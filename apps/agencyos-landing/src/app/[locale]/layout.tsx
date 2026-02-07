import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales } from '@/i18n/config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { LenisProvider } from '@/lib/lenis-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import { LazyMotionProvider } from '@/components/motion/lazy-motion-provider';
import { StickyCTA } from '@/components/marketing/sticky-cta';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://agencyos.dev';

  const metadataMap: Record<string, { title: string; description: string; keywords: string }> = {
    en: {
      title: 'AgencyOS - Build AI Agents at 10x Speed',
      description: 'The operating system for AI-powered agencies. Ship autonomous agent systems in hours, not months.',
      keywords: 'AI agents, autonomous systems, agency OS, multi-agent, orchestration',
    },
    vi: {
      title: 'AgencyOS - Xây Dựng AI Agent Nhanh 10x',
      description: 'Hệ điều hành cho agency AI. Triển khai hệ thống agent tự động trong vài giờ.',
      keywords: 'AI agents, hệ thống tự động, agency OS, đa agent, điều phối',
    },
  };

  const metadata = metadataMap[locale] || metadataMap.en;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        vi: '/vi',
      },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `${baseUrl}/${locale}`,
      siteName: 'AgencyOS',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'AgencyOS - AI Agent Operating System',
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as "en" | "vi")) {
    notFound();
  }

  const messages = await getMessages();

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://agencyos.dev/#organization',
        name: 'AgencyOS',
        url: 'https://agencyos.dev',
        logo: {
          '@type': 'ImageObject',
          url: 'https://agencyos.dev/logo.png',
        },
        sameAs: [
          'https://twitter.com/agencyos',
          'https://github.com/agencyos',
        ],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://agencyos.dev/#software',
        name: 'AgencyOS',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '99',
          priceCurrency: 'USD',
          priceValidUntil: '2025-12-31',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '127',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://agencyos.dev/#website',
        url: 'https://agencyos.dev',
        name: 'AgencyOS',
        inLanguage: locale,
      },
    ],
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} bg-deep-space-900 text-starlight-100 selection:bg-nebula-500/30`}>
        <NextIntlClientProvider messages={messages}>
          <LazyMotionProvider>
            <AnalyticsProvider>
              <LenisProvider>
                <div className="fixed inset-0 z-0 pointer-events-none noise-texture opacity-20 mix-blend-overlay"></div>
                <div className="relative z-10">
                  {children}
                </div>
                <StickyCTA />
              </LenisProvider>
            </AnalyticsProvider>
          </LazyMotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
