# SEO Optimization Guide for AgencyOS

This guide details the SEO optimization system implemented in AgencyOS (IPO-026-SEO).

## Core Components

### 1. Meta Tags (`apps/web/components/seo/meta-tags.tsx`)

Used to inject dynamic meta tags into the `<head>` of your pages.

**Usage:**

```tsx
import MetaTags from '@/components/seo/meta-tags';

export default function Page() {
  return (
    <>
      <MetaTags
        title="Page Title"
        description="Page description for search engines."
        keywords={['keyword1', 'keyword2']}
        ogImage="/images/og-image.png"
      />
      {/* Page Content */}
    </>
  );
}
```

### 2. Structured Data (`apps/web/components/seo/structured-data.tsx`)

Provides JSON-LD schema for rich snippets.

**Usage:**

```tsx
import { OrganizationLD, ProductLD, BreadcrumbLD } from '@/components/seo/structured-data';

export default function Page() {
  return (
    <>
      <OrganizationLD
        name="AgencyOS"
        logo="https://agencyos.ai/logo.png"
        url="https://agencyos.ai"
        sameAs={['https://twitter.com/agencyos']}
      />
      {/* ... */}
    </>
  );
}
```

### 3. Sitemap & Robots.txt

- **Sitemap**: Automatically generated at `/sitemap.xml` via `apps/web/app/sitemap.xml/route.ts`.
- **Robots.txt**: Automatically generated at `/robots.txt` via `apps/web/app/robots.txt/route.ts`.

To add dynamic routes to the sitemap, modify `apps/web/lib/seo/sitemap-generator.ts`.

## Backend Services

### SEO Service (`backend/services/seo_service.py`)

Provides utilities for:
- Analyzing page performance using Google PageSpeed Insights API.
- Generating sitemaps programmatically (for backend-driven generation).

### Sitemap Worker (`backend/workers/sitemap_worker.py`)

A worker script designed to be run periodically (e.g., via Cron or Celery) to regenerate static sitemaps if needed.

## Configuration

SEO settings are managed in `config/seo-config.yaml`.

```yaml
seo:
  default_meta:
    title: "AgencyOS"
    # ...
  google_search_console:
    api_key: "${GOOGLE_SEARCH_CONSOLE_API_KEY}"
```

## Best Practices

1.  **Titles**: Keep under 60 characters. Include primary keyword.
2.  **Descriptions**: Keep under 160 characters. Use a call to action.
3.  **Images**: Always provide `alt` text and use OpenGraph images (1200x630px).
4.  **Performance**: Monitor Core Web Vitals (LCP, FID, CLS) using the backend service.

## Verification

- Use **Google Rich Results Test** to verify JSON-LD.
- Use **Facebook Sharing Debugger** to verify OpenGraph tags.
- Use **Google Search Console** to submit your sitemap and check for crawl errors.
