# Real-Time Intelligence — Market Data & Competitive Intelligence

Aggregates market data streams, runs sentiment analysis, fires real-time alerts, and builds competitive intelligence dashboards for strategic decision-making.

## When to Use
- Building real-time market monitoring systems (price feeds, news, social signals)
- Implementing sentiment analysis pipelines over news or social data
- Creating competitive intelligence dashboards with automated tracking
- Setting up event-driven alert systems for market or competitor triggers

## Key Concepts
- **Data Sources**: Market feeds (Yahoo Finance, Polygon.io, Alpha Vantage), News APIs (NewsAPI, GDELT), Social (Reddit, X/Twitter API), SEC filings
- **Sentiment Analysis**: VADER (rule-based, fast), FinBERT (finance-tuned BERT), LLM-based scoring for nuance
- **Stream Processing**: Kafka / Redis Streams / SSE for low-latency event pipelines
- **Alert Triggers**: Price threshold, volume spike, sentiment shift (>±0.3 delta), competitor product launch, regulatory filing
- **Intelligence Layers**: Raw data → Normalized events → Entity extraction → Sentiment → Trend signals → Actionable alerts
- **Dashboard KPIs**: Share of voice, sentiment trend, competitor mention velocity, market cap movement, news impact score

## Implementation Patterns

```python
# Sentiment pipeline with FinBERT
from transformers import pipeline

sentiment = pipeline("text-classification", model="ProsusAI/finbert")

def score_news_batch(articles: list[dict]) -> list[dict]:
    texts = [a["headline"] + ". " + a.get("summary", "") for a in articles]
    scores = sentiment(texts, batch_size=16, truncation=True)
    return [
        {**article, "sentiment": s["label"], "confidence": s["score"]}
        for article, s in zip(articles, scores)
    ]
```

```typescript
// Real-time alert engine (Redis Streams + SSE)
const ALERT_RULES = [
  { metric: "price_change_pct", threshold: 0.05, direction: "either" },
  { metric: "sentiment_delta",  threshold: 0.30, window_minutes: 60 },
  { metric: "mention_velocity", threshold: 100,  window_minutes: 15 },
];

async function evaluateAlerts(ticker: string, snapshot: Snapshot) {
  for (const rule of ALERT_RULES) {
    if (Math.abs(snapshot[rule.metric]) >= rule.threshold) {
      await redis.xadd("alerts", "*", { ticker, rule: rule.metric, value: snapshot[rule.metric] });
    }
  }
}
```

```yaml
# Competitive intel tracker config
competitors:
  - name: Competitor A
    domains: ["competitora.com"]
    tickers: ["CMPA"]
    monitor:
      news: true
      product_pages: weekly   # diff-track pricing/features
      job_postings: true      # hiring signals = strategy signals
      social: ["twitter", "linkedin"]
      regulatory: ["SEC", "EU_GDPR"]
alert_channels: [slack, email, webhook]
```

## References
- FinBERT Model: https://huggingface.co/ProsusAI/finbert
- Polygon.io Market Data: https://polygon.io/docs/
- GDELT News Dataset: https://www.gdeltproject.org/
