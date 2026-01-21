/**
 * 📊 VIBE Analytics - Sharing Utilities
 */
import { ShareContent } from './types';

/**
 * Shares content using the Web Share API or fallbacks to clipboard
 */
export async function shareContent(content: ShareContent): Promise<'native' | 'copy' | 'fail'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(content);
      return 'native';
    } catch (error) {
      // Fallback if user cancelled or error occurred
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      const textToCopy = content.url
        ? `${content.title}\n${content.url}`
        : `${content.title}\n${content.text}`;
      await navigator.clipboard.writeText(textToCopy);
      return 'copy';
    } catch (error) {
      return 'fail';
    }
  }

  return 'fail';
}
