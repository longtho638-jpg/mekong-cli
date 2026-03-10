/**
 * AnomalyDetector — Isolation Forest-inspired anomaly detection in TypeScript.
 * Scores data points by average path length across isolation trees.
 * SIMULATION MODE ONLY.
 */

export interface MarketSnapshot {
  price: number;
  volume: number;
  spreadBps: number;
  fillRate: number;
  latencyMs: number;
}

interface IsolationNode {
  feature: keyof MarketSnapshot | null;
  splitValue: number;
  left: IsolationNode | null;
  right: IsolationNode | null;
  size: number;
}

const FEATURES: Array<keyof MarketSnapshot> = ['price', 'volume', 'spreadBps', 'fillRate', 'latencyMs'];
const NUM_TREES = 50;
const SUBSAMPLE_SIZE = 32;

/** Average path length for a BST with n nodes (correction factor). */
function avgPathLength(n: number): number {
  if (n <= 1) return 0;
  return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
}

function buildTree(data: MarketSnapshot[], depth: number, maxDepth: number): IsolationNode {
  if (data.length <= 1 || depth >= maxDepth) {
    return { feature: null, splitValue: 0, left: null, right: null, size: data.length };
  }
  const feature = FEATURES[Math.floor(Math.random() * FEATURES.length)];
  const vals = data.map((d) => d[feature] as number);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) {
    return { feature: null, splitValue: 0, left: null, right: null, size: data.length };
  }
  const splitValue = min + Math.random() * (max - min);
  const left = data.filter((d) => (d[feature] as number) < splitValue);
  const right = data.filter((d) => (d[feature] as number) >= splitValue);
  return {
    feature,
    splitValue,
    left: buildTree(left, depth + 1, maxDepth),
    right: buildTree(right, depth + 1, maxDepth),
    size: data.length,
  };
}

function pathLength(node: IsolationNode, point: MarketSnapshot, depth: number): number {
  if (!node.feature || !node.left || !node.right) {
    return depth + avgPathLength(node.size);
  }
  const val = point[node.feature] as number;
  return val < node.splitValue
    ? pathLength(node.left, point, depth + 1)
    : pathLength(node.right, point, depth + 1);
}

/**
 * Isolation Forest detector. Train on a window of snapshots, then score.
 * Score near 1.0 = highly anomalous; near 0.0 = normal.
 */
export class AnomalyDetector {
  private trees: IsolationNode[] = [];
  private trained = false;

  /**
   * Train the isolation forest on a data window.
   * @param data - Historical market snapshots
   */
  train(data: MarketSnapshot[]): void {
    if (data.length < 2) return;
    const maxDepth = Math.ceil(Math.log2(SUBSAMPLE_SIZE));
    this.trees = [];
    for (let i = 0; i < NUM_TREES; i++) {
      const sample = this.subsample(data, SUBSAMPLE_SIZE);
      this.trees.push(buildTree(sample, 0, maxDepth));
    }
    this.trained = true;
  }

  /**
   * Score a snapshot — returns anomaly probability [0, 1].
   * @param point - Market snapshot to evaluate
   */
  score(point: MarketSnapshot): number {
    if (!this.trained || this.trees.length === 0) return 0;
    const avgLen = this.trees.reduce((s, t) => s + pathLength(t, point, 0), 0) / this.trees.length;
    const correction = avgPathLength(SUBSAMPLE_SIZE);
    if (correction === 0) return 0;
    return Math.pow(2, -avgLen / correction);
  }

  isTrained(): boolean { return this.trained; }

  private subsample(data: MarketSnapshot[], n: number): MarketSnapshot[] {
    const copy = [...data];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }
}
