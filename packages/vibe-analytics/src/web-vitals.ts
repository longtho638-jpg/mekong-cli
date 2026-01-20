/**
 * 📊 VIBE Analytics - Web Vitals
 */
import { WebVitals } from './types';

export async function collectWebVitals(): Promise<WebVitals> {
  const vitals: WebVitals = {};
  if (typeof performance === "undefined") return vitals;
  try {
    const entries = performance.getEntriesByType("paint") as any[];
    const fcp = entries.find((e) => e.name === "first-contentful-paint");
    if (fcp) vitals.fcp = fcp.startTime;
    const nav = performance.getEntriesByType("navigation")[0] as any;
    if (nav) vitals.ttfb = nav.responseStart - nav.requestStart;
  } catch {}
  return vitals;
}
