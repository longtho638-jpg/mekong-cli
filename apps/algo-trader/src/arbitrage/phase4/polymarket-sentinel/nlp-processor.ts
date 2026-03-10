/**
 * NlpProcessor — rule-based sentiment analysis for financial headlines.
 * No external dependencies. Pure keyword-matching for simulation mode.
 */

export interface SentimentResult {
  score: number;       // -1.0 to 1.0
  confidence: number;  // 0.0 to 1.0
  keywords: string[];
}

const BULLISH_KEYWORDS: Record<string, number> = {
  surge: 0.7, rally: 0.8, soar: 0.9, gain: 0.5, boost: 0.6,
  approval: 0.7, adoption: 0.6, upgrade: 0.5, bullish: 0.9,
  recovery: 0.6, growth: 0.5, promising: 0.5, high: 0.4,
  'all-time': 0.7, institutional: 0.5, breakthrough: 0.8,
};

const BEARISH_KEYWORDS: Record<string, number> = {
  crash: -0.9, plunge: -0.8, slump: -0.7, drop: -0.5, fall: -0.5,
  probe: -0.6, ban: -0.8, hack: -0.9, panic: -0.8, fear: -0.6,
  recession: -0.8, inflation: -0.5, hike: -0.4, disappoint: -0.6,
  depegging: -0.9, liquidation: -0.8, bearish: -0.9, mount: -0.4,
};

export class NlpProcessor {
  analyzeSentiment(headline: string): SentimentResult {
    const lower = headline.toLowerCase();
    const words = lower.split(/\W+/);
    const matched: string[] = [];
    let rawScore = 0;

    for (const word of words) {
      if (BULLISH_KEYWORDS[word] !== undefined) {
        rawScore += BULLISH_KEYWORDS[word];
        matched.push(word);
      } else if (BEARISH_KEYWORDS[word] !== undefined) {
        rawScore += BEARISH_KEYWORDS[word];
        matched.push(word);
      }
    }

    // Check bigrams for composite phrases
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]}-${words[i + 1]}`;
      if (BULLISH_KEYWORDS[bigram] !== undefined) {
        rawScore += BULLISH_KEYWORDS[bigram];
        matched.push(bigram);
      } else if (BEARISH_KEYWORDS[bigram] !== undefined) {
        rawScore += BEARISH_KEYWORDS[bigram];
        matched.push(bigram);
      }
    }

    // Clamp score to [-1, 1]
    const score = Math.max(-1, Math.min(1, rawScore));
    // Confidence grows with number of matched keywords, caps at 0.95
    const confidence = Math.min(0.95, 0.2 + matched.length * 0.15);

    return { score, confidence, keywords: matched };
  }

  batchAnalyze(headlines: string[]): SentimentResult[] {
    return headlines.map(h => this.analyzeSentiment(h));
  }
}
