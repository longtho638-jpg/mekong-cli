---
name: media-entertainment
description: Streaming platforms, content distribution, digital asset management, rights management, OTT video, podcast, music tech. Use for media apps, streaming services, content platforms.
license: MIT
version: 1.0.0
---

# Media & Entertainment Technology Skill

Build streaming platforms, content distribution systems, digital asset management, rights tracking, and entertainment applications.

## When to Use

- OTT/streaming platform development
- Video transcoding and delivery pipeline
- Digital Asset Management (DAM) systems
- Content rights and royalty management
- Podcast hosting and distribution
- Music streaming and licensing
- Live streaming and interactive events
- Content recommendation engines
- Ad tech and video monetization
- Media analytics and audience measurement

## Tool Selection

| Need | Choose |
|------|--------|
| Video transcoding | Mux (API-first), AWS MediaConvert, Cloudflare Stream |
| Video player | Video.js, Shaka Player, hls.js, Mux Player |
| Live streaming | Mux Live, AWS IVS, Agora, LiveKit |
| DAM platform | Bynder, Cloudinary (dev-first), Brandfolder |
| Content CMS | Contentful, Sanity.io, Strapi (self-hosted) |
| Podcast hosting | Transistor API, Buzzsprout, Spotify for Podcasters |
| Music licensing | Epidemic Sound API, Artlist, Synchedin |
| Rights management | FilmTrack, RightsLine, Vistex |
| Ad tech (video) | Google Ad Manager, SpotX, FreeWheel |
| Analytics | Conviva (streaming QoE), Nielsen, Chartable (podcast) |

## Streaming Architecture

```
Content Ingestion (upload / live capture)
    ↓
┌────────────────────────────────────────────┐
│  Processing Pipeline                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Transcode│  │ DRM      │  │ Metadata │ │
│  │ (ABR)    │  │ Encrypt  │  │ Extract  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  CDN Distribution                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ HLS/DASH │  │ Edge     │  │ Adaptive │ │
│  │ Manifest │  │ Cache    │  │ Bitrate  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Player   │  │ Analytics│  │ Recommend│
│ SDK      │  │ (QoE)    │  │ Engine   │
└──────────┘  └──────────┘  └──────────┘
```

## Mux Video API Integration

```python
import mux_python

configuration = mux_python.Configuration()
configuration.username = "MUX_TOKEN_ID"
configuration.password = "MUX_TOKEN_SECRET"

assets_api = mux_python.AssetsApi(mux_python.ApiClient(configuration))

# Upload video
create_asset = mux_python.CreateAssetRequest(
    input=[mux_python.InputSettings(url="https://example.com/video.mp4")],
    playback_policy=[mux_python.PlaybackPolicy.PUBLIC],
    encoding_tier="smart"
)
asset = assets_api.create_asset(create_asset)
# asset.data.playback_ids[0].id → use in Mux Player

# Get asset details
asset_detail = assets_api.get_asset(asset.data.id)
# asset_detail.data.status → "ready" when transcoded
```

## Video Delivery Formats

| Format | Use Case | DRM Support |
|--------|----------|-------------|
| HLS (fMP4) | Apple devices, web | FairPlay |
| DASH | Android, Smart TVs | Widevine, PlayReady |
| CMAF | Unified (HLS+DASH) | Multi-DRM |
| WebRTC | Ultra-low latency live | N/A |
| SRT | Professional broadcast ingest | N/A |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Startup Time | Player init → First frame | < 2s |
| Rebuffer Rate | Rebuffer events / Play sessions | < 1% |
| Video Quality (MOS) | Mean Opinion Score (1-5) | > 4.0 |
| Content Engagement | Avg watch time / Content length | > 60% |
| Stream Concurrency | Peak simultaneous viewers | Per infrastructure |
| Transcode Speed | Real-time ratio (1x = real-time) | > 4x for VOD |
| CDN Cache Hit | Cached / Total requests | > 95% |
| Ad Fill Rate | Filled / Available ad slots | > 85% |
| DAM Asset Utilization | Used / Total assets | > 40% |

## References

- Mux: https://docs.mux.com
- Cloudflare Stream: https://developers.cloudflare.com/stream
- AWS IVS: https://docs.aws.amazon.com/ivs
- Cloudinary: https://cloudinary.com/documentation
- Contentful: https://www.contentful.com/developers/docs
- Sanity.io: https://www.sanity.io/docs
- Video.js: https://videojs.com
- LiveKit: https://docs.livekit.io
- Conviva: https://developer.conviva.com
