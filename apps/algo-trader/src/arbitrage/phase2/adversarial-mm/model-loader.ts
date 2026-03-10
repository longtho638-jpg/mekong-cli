/**
 * ONNX model loader for spoofing/iceberg detection.
 * Loads an ONNX model via onnxruntime-node and provides inference API.
 * Falls back to heuristic detector when model file is unavailable.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import * as fs from 'fs';

/** Input features for the spoof detection model */
export interface ModelInput {
  cancelRatio: number;
  refillCount: number;
  bidAskRatio: number;
  volumeImbalance: number;
  priceLevel: number;
  timeDeltaMs: number;
}

/** Model prediction output */
export interface ModelPrediction {
  spoofProbability: number;
  icebergProbability: number;
  layeringProbability: number;
  confidence: number;
}

export interface ModelLoaderConfig {
  modelPath?: string;
  warmupOnLoad?: boolean;
}

/**
 * Loads and runs ONNX spoof detection model.
 * Falls back gracefully if onnxruntime-node or model file unavailable.
 */
export class ModelLoader extends EventEmitter {
  private session: unknown = null;
  private loaded = false;
  private readonly config: Required<ModelLoaderConfig>;

  constructor(config: ModelLoaderConfig = {}) {
    super();
    this.config = {
      modelPath: config.modelPath ?? './models/spoof-detector.onnx',
      warmupOnLoad: config.warmupOnLoad ?? true,
    };
  }

  /** Load ONNX model. Returns false if model unavailable (heuristic fallback). */
  async load(): Promise<boolean> {
    const modelExists = fs.existsSync(this.config.modelPath);
    if (!modelExists) {
      logger.warn(`[ModelLoader] Model not found at ${this.config.modelPath}, using heuristic fallback`);
      this.loaded = false;
      this.emit('fallback', { reason: 'model_not_found' });
      return false;
    }

    try {
      // Dynamic import — onnxruntime-node is optional dependency
      // Dynamic require — onnxruntime-node is optional peer dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ortModule = 'onnxruntime-node';
      const ort = await import(/* webpackIgnore: true */ ortModule);
      this.session = await ort.InferenceSession.create(this.config.modelPath);
      this.loaded = true;

      if (this.config.warmupOnLoad) {
        await this.predict(this.defaultInput());
      }

      logger.info('[ModelLoader] ONNX model loaded successfully');
      this.emit('loaded', { modelPath: this.config.modelPath });
      return true;
    } catch (err) {
      logger.warn(`[ModelLoader] Failed to load ONNX model: ${(err as Error).message}`);
      this.loaded = false;
      this.emit('fallback', { reason: 'load_error', error: (err as Error).message });
      return false;
    }
  }

  /** Run inference. Falls back to heuristic if model not loaded. */
  async predict(input: ModelInput): Promise<ModelPrediction> {
    if (!this.loaded || !this.session) {
      return this.heuristicPredict(input);
    }

    try {
      // Dynamic require — onnxruntime-node is optional peer dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ortModule = 'onnxruntime-node';
      const ort = await import(/* webpackIgnore: true */ ortModule);
      const tensor = new ort.Tensor('float32', [
        input.cancelRatio,
        input.refillCount,
        input.bidAskRatio,
        input.volumeImbalance,
        input.priceLevel,
        input.timeDeltaMs,
      ], [1, 6]);

      const session = this.session as { run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array }>> };
      const results = await session.run({ input: tensor });
      const output = results['output']?.data;

      if (!output || output.length < 3) {
        return this.heuristicPredict(input);
      }

      return {
        spoofProbability: output[0],
        icebergProbability: output[1],
        layeringProbability: output[2],
        confidence: Math.max(output[0], output[1], output[2]),
      };
    } catch (err) {
      logger.debug(`[ModelLoader] Inference error, falling back to heuristic: ${(err as Error).message}`);
      return this.heuristicPredict(input);
    }
  }

  /** Heuristic fallback when ONNX model unavailable */
  private heuristicPredict(input: ModelInput): ModelPrediction {
    const spoofProbability = Math.min(0.99, Math.max(0, input.cancelRatio * 0.8 + 0.1));
    const icebergProbability = Math.min(0.95, Math.max(0, (input.refillCount / 6) * 0.7));
    const layeringProbability = Math.min(0.95, Math.max(0, (input.bidAskRatio > 3 ? 0.6 : 0.1) + input.volumeImbalance * 0.3));

    return {
      spoofProbability,
      icebergProbability,
      layeringProbability,
      confidence: Math.max(spoofProbability, icebergProbability, layeringProbability),
    };
  }

  /** Default input for warmup inference */
  private defaultInput(): ModelInput {
    return { cancelRatio: 0, refillCount: 0, bidAskRatio: 1, volumeImbalance: 0, priceLevel: 50000, timeDeltaMs: 1000 };
  }

  isLoaded(): boolean { return this.loaded; }

  async dispose(): Promise<void> {
    if (this.session && this.loaded) {
      try {
        const s = this.session as { release(): Promise<void> };
        await s.release();
      } catch { /* ignore */ }
    }
    this.session = null;
    this.loaded = false;
  }
}
