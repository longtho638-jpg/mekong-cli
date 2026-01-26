export interface SpamScoreResult {
  score: number;
  details: string[];
  isSpam: boolean;
}

/**
 * Checks the spam score of an email content.
 * Note: Real implementation would integrate with a service like Postmark's SpamCheck API or Mail-Tester.
 * For this kit, we'll implement a heuristic-based local checker and provide hooks for external APIs.
 */
export async function checkSpamScore(subject: string, html: string): Promise<SpamScoreResult> {
  const spamKeywords = [
    'buy now', 'free', 'click here', 'subscribe', 'guarantee', 'risk-free',
    'special promotion', 'bonus', 'credit card', 'urgent'
  ];

  let score = 0;
  const details: string[] = [];

  // 1. Subject Line Checks
  if (subject.toUpperCase() === subject) {
    score += 2;
    details.push('Subject line is all caps');
  }

  if (subject.includes('!')) {
    score += 1;
    details.push('Subject line contains exclamation marks');
  }

  // 2. Content Checks
  const lowerHtml = html.toLowerCase();

  spamKeywords.forEach(keyword => {
    if (lowerHtml.includes(keyword)) {
      score += 0.5;
      details.push(`Contains spam keyword: "${keyword}"`);
    }
  });

  // 3. HTML to Text Ratio (simplified)
  const textLength = html.replace(/<[^>]*>/g, '').length;
  const htmlLength = html.length;
  const ratio = textLength / htmlLength;

  if (ratio < 0.2) {
    score += 1;
    details.push('Low text-to-HTML ratio');
  }

  return {
    score,
    details,
    isSpam: score > 5
  };
}
