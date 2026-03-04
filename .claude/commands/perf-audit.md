---
description: 🚀 Perf Audit — Full Performance Audit (LCP, FID, CLS, TTI)
argument-hint: [url] [--thresholds] [--mobile]
---

**Think harder** để perf audit: <url>$ARGUMENTS</url>

**IMPORTANT:** Core Web Vitals PHẢI green — LCP < 2.5s, FID < 100ms, CLS < 0.1.

## Performance Metrics

| Metric | Target | Priority |
|--------|--------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | High |
| **FID** (First Input Delay) | < 100ms | High |
| **CLS** (Cumulative Layout Shift) | < 0.1 | High |
| **FCP** (First Contentful Paint) | < 1.5s | Medium |
| **TTI** (Time to Interactive) | < 3.5s | Medium |
| **TBT** (Total Blocking Time) | < 300ms | Medium |

## Audit Commands

```bash
# === Lighthouse Performance ===
npx lighthouse https://app.agencyos.network --only-categories=performance

# === WebPageTest ===
curl -X POST https://www.webpagetest.org/runtest.php \
  -d "url=https://app.agencyos.network" \
  -d "f=json"

# === PageSpeed Insights ===
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://app.agencyos.network&category=PERFORMANCE"

# === Chrome DevTools ===
# Open DevTools → Lighthouse → Run metrics
```

## Optimization Checklist

```markdown
## Images
- [ ] Convert to WebP/AVIF
- [ ] Lazy load below fold
- [ ] Proper sizing (srcset)
- [ ] Compression enabled

## JavaScript
- [ ] Code splitting
- [ ] Tree shaking
- [ ] Minification
- [ ] Defer non-critical

## CSS
- [ ] Critical CSS inline
- [ ] Remove unused CSS
- [ ] Minification

## Caching
- [ ] Browser caching headers
- [ ] CDN enabled
- [ ] Service worker

## Server
- [ ] Gzip/Brotli compression
- [ ] HTTP/2 enabled
- [ ] Edge caching
- [ ] Database query optimization
```

## Related Commands

- `/lighthouse` — Lighthouse audits
- `/bundle-analyze` — Bundle size analysis
- `/test:performance` — Performance testing
- `/a11y-audit` — Accessibility audit
