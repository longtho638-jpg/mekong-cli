/**
 * Validates the structure of the generated HTML for email compatibility.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmailHtml(html: string): ValidationResult {
  const errors: string[] = [];

  // 1. Check for required structural elements
  if (!html.includes('<!DOCTYPE html')) {
    errors.push('Missing DOCTYPE declaration');
  }

  if (!html.includes('<html')) {
    errors.push('Missing <html> tag');
  }

  if (!html.includes('<body')) {
    errors.push('Missing <body> tag');
  }

  // 2. Check for disallowed tags in emails
  const disallowedTags = ['script', 'iframe', 'object', 'embed', 'form'];
  disallowedTags.forEach(tag => {
    if (new RegExp(`<${tag}[^>]*>`, 'i').test(html)) {
      errors.push(`Disallowed tag found: <${tag}>`);
    }
  });

  // 3. Check for empty links
  if (html.includes('href=""') || html.includes("href=''")) {
    errors.push('Found empty links (href="")');
  }

  // 4. Check for missing alt text on images
  const imgTags = html.match(/<img[^>]+>/g) || [];
  imgTags.forEach(img => {
    if (!img.includes('alt=')) {
      errors.push('Image missing alt text');
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
