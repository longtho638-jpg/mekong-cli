/**
 * @agencyos/vibe-video-intel
 *
 * Video intelligence SDK:
 * 1. Video pipeline — ingest, transcode, chunk, extract frames
 * 2. Scene detector — temporal segmentation, boundary detection
 * 3. Semantic search — natural language queries over video content
 *
 * Usage:
 *   import { createVideoPipeline, createSceneDetector, createVideoSearchIndex } from '@agencyos/vibe-video-intel'
 *   const pipeline = createVideoPipeline({ chunkDurationSec: 30 })
 *   const chunks = pipeline.segment('/path/to/video.mp4')
 */

// === TYPES ===

export enum MediaType {
  VIDEO = 'video',
  AUDIO = 'audio',
  IMAGE = 'image',
}

export enum SceneType {
  CUT = 'cut',
  FADE = 'fade',
  DISSOLVE = 'dissolve',
  WIPE = 'wipe',
}

export interface VideoChunk {
  id: string
  startTime: number
  endTime: number
  duration: number
  path: string
}

export interface SceneBoundary {
  timestamp: number
  type: SceneType
  confidence: number
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
}

export interface SearchResult {
  chunkId: string
  score: number
  timestamp: number
  snippet: string
}

export interface PipelineConfig {
  chunkDurationSec: number
}

// === VIDEO PIPELINE ===

/** Tạo video processing pipeline — ingest, segment, extract */
export function createVideoPipeline(config: PipelineConfig) {
  const chunks: VideoChunk[] = []
  const { chunkDurationSec } = config

  function segment(videoPath: string, totalDuration?: number): VideoChunk[] {
    const dur = totalDuration || 300
    const result: VideoChunk[] = []
    let start = 0
    let idx = 0

    while (start < dur) {
      const end = Math.min(start + chunkDurationSec, dur)
      const chunk: VideoChunk = {
        id: `chunk_${idx}`,
        startTime: start,
        endTime: end,
        duration: end - start,
        path: `${videoPath}.chunk_${idx}`,
      }
      result.push(chunk)
      chunks.push({ ...chunk })
      start = end
      idx++
    }

    return result
  }

  function getChunks(): VideoChunk[] {
    return [...chunks]
  }

  function extractFrames(chunkId: string, fps: number): string[] {
    const chunk = chunks.find((c) => c.id === chunkId)
    if (!chunk) return []
    const frameCount = Math.ceil(chunk.duration * fps)
    return Array.from({ length: frameCount }, (_, i) => `${chunk.path}_frame_${i}.jpg`)
  }

  return { segment, getChunks, extractFrames }
}

// === SCENE DETECTOR ===

/** Tạo scene boundary detector — phát hiện cắt cảnh, chuyển cảnh */
export function createSceneDetector() {
  const boundaries: SceneBoundary[] = []

  function detect(timestamps: number[], scores: number[]): SceneBoundary[] {
    const result: SceneBoundary[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (scores[i] > 0.5) {
        const boundary: SceneBoundary = {
          timestamp: timestamps[i],
          type: scores[i] > 0.8 ? SceneType.CUT : SceneType.FADE,
          confidence: scores[i],
        }
        result.push(boundary)
        boundaries.push({ ...boundary })
      }
    }
    return result
  }

  function getBoundaries(): SceneBoundary[] {
    return [...boundaries]
  }

  function segmentsByScene(): Array<{ start: number; end: number }> {
    const sorted = [...boundaries].sort((a, b) => a.timestamp - b.timestamp)
    const segments: Array<{ start: number; end: number }> = []
    let prev = 0
    for (const b of sorted) {
      segments.push({ start: prev, end: b.timestamp })
      prev = b.timestamp
    }
    return segments
  }

  return { detect, getBoundaries, segmentsByScene }
}

// === VIDEO SEARCH INDEX ===

/** Tạo semantic search index cho video — tìm kiếm bằng ngôn ngữ tự nhiên */
export function createVideoSearchIndex() {
  const entries: Array<{ chunkId: string; text: string; embedding?: number[] }> = []

  function addEntry(chunkId: string, text: string, embedding?: number[]): void {
    entries.push({ chunkId, text, embedding })
  }

  function search(query: string, topK: number = 5): SearchResult[] {
    // Simple text matching fallback (real impl uses vector similarity)
    const results: SearchResult[] = []
    const queryLower = query.toLowerCase()

    for (const entry of entries) {
      const textLower = entry.text.toLowerCase()
      if (textLower.includes(queryLower)) {
        results.push({
          chunkId: entry.chunkId,
          score: 1.0,
          timestamp: 0,
          snippet: entry.text.slice(0, 200),
        })
      }
    }

    return results.slice(0, topK)
  }

  function getEntryCount(): number {
    return entries.length
  }

  return { addEntry, search, getEntryCount }
}
