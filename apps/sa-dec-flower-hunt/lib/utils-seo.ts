/**
 * Sanitizes data for safe injection into a <script type="application/ld+json"> tag.
 * 
 * Prevents XSS attacks where a malicious string breaks out of the script tag
 * (e.g., "</script><script>alert(1)</script>").
 * 
 * @param data The JSON-LD object to sanitize
 * @returns A sanitized JSON string safe for dangerouslySetInnerHTML
 */
export function safeJsonLd(data: any): string {
  return JSON.stringify(data).replace(/</g, '\u003c');
}