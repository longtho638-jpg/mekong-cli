/**
 * Code Generator — converts a strategy AST to executable TypeScript source.
 * Generates a self-contained function that accepts bar data and returns a signal.
 */

import { AstNode } from './grammar';

export interface GeneratedStrategy {
  id: string;
  sourceCode: string;
  generatedAt: number;
  astNodeCount: number;
}

export interface CodeGeneratorConfig {
  functionName: string;
  includeComments: boolean;
}

const DEFAULT_CONFIG: CodeGeneratorConfig = {
  functionName: 'strategySignal',
  includeComments: true,
};

let _genIdCounter = 0;
function nextGenId(): string {
  return `gen-${++_genIdCounter}`;
}

// ── AST → TypeScript expression ──────────────────────────────────────────────

function nodeToExpr(node: AstNode): string {
  switch (node.type) {
    case 'price': {
      const lag = node.lag > 0 ? `bars[Math.max(0, idx - ${node.lag})].${node.field}` : `bar.${node.field}`;
      return lag;
    }
    case 'indicator': {
      return `indicators.${node.name}(bars, idx, ${node.period})`;
    }
    case 'binary': {
      const l = nodeToExpr(node.left);
      const r = nodeToExpr(node.right);
      return `(${l} ${node.op} ${r})`;
    }
    case 'unary': {
      const v = nodeToExpr(node.operand);
      if (node.op === 'neg') return `(-(${v}))`;
      if (node.op === 'abs') return `Math.abs(${v})`;
      if (node.op === 'log') return `(${v} > 0 ? Math.log(${v}) : 0)`;
      return `(${v})`;
    }
    case 'condition': {
      const test = nodeToExpr(node.test);
      const cons = nodeToExpr(node.consequent);
      const alt = nodeToExpr(node.alternate);
      return `((${test}) !== 0 ? (${cons}) : (${alt}))`;
    }
  }
}

/** Count total AST nodes (for metadata). */
function countAstNodes(node: AstNode): number {
  if (node.type === 'binary') return 1 + countAstNodes(node.left) + countAstNodes(node.right);
  if (node.type === 'unary') return 1 + countAstNodes(node.operand);
  if (node.type === 'condition') {
    return 1 + countAstNodes(node.test) + countAstNodes(node.consequent) + countAstNodes(node.alternate);
  }
  return 1;
}

// ── CodeGenerator class ───────────────────────────────────────────────────────

export class CodeGenerator {
  private readonly cfg: CodeGeneratorConfig;

  constructor(config: Partial<CodeGeneratorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Convert an AST to a TypeScript source string.
   * The generated function signature:
   *   (bar, bars, idx, indicators) => number
   * Returns > 0 for long signal, < 0 for short, 0 for hold.
   */
  generate(ast: AstNode): GeneratedStrategy {
    const expr = nodeToExpr(ast);
    const comment = this.cfg.includeComments
      ? `// Auto-generated strategy — NS3 Neural-Symbolic Synthesizer\n// Do not edit manually.\n`
      : '';

    const sourceCode = `${comment}export function ${this.cfg.functionName}(
  bar: { open: number; high: number; low: number; close: number; vwap: number },
  bars: Array<{ open: number; high: number; low: number; close: number; vwap: number }>,
  idx: number,
  indicators: {
    sma: (bars: unknown[], idx: number, period: number) => number;
    ema: (bars: unknown[], idx: number, period: number) => number;
    rsi: (bars: unknown[], idx: number, period: number) => number;
    macd: (bars: unknown[], idx: number, period: number) => number;
    atr: (bars: unknown[], idx: number, period: number) => number;
  },
): number {
  return ${expr};
}
`;

    return {
      id: nextGenId(),
      sourceCode,
      generatedAt: Date.now(),
      astNodeCount: countAstNodes(ast),
    };
  }

  /**
   * "Compile" the generated source by wrapping it in a Function constructor.
   * Returns the callable signal function, or throws on syntax error.
   * In production this would invoke the TS compiler; here we use JS eval path.
   */
  compile(generated: GeneratedStrategy): (bar: Record<string, number>, bars: Record<string, number>[], idx: number) => number {
    // Strip TS type annotations for runtime eval
    const jsSource = generated.sourceCode
      .replace(/\/\/ .*\n/g, '')
      .replace(/export function \w+\([^)]*\)[^{]*\{/s, 'return function(bar, bars, idx, indicators) {')
      .trimEnd();

    // Build simple indicator stubs for the compiled function
    const indicators = {
      sma: (b: Array<Record<string, number>>, i: number, p: number) => {
        const sl = b.slice(Math.max(0, i - p + 1), i + 1);
        return sl.reduce((s, v) => s + v['close'], 0) / (sl.length || 1);
      },
      ema: (b: Array<Record<string, number>>, i: number, p: number) => {
        const sl = b.slice(Math.max(0, i - p + 1), i + 1).map((v) => v['close']);
        const k = 2 / (sl.length + 1);
        return sl.reduce((ema, v) => v * k + ema * (1 - k), sl[0] ?? 0);
      },
      rsi: (_b: unknown[], _i: number, _p: number) => 50,
      macd: (_b: unknown[], _i: number, _p: number) => 0,
      atr: (_b: unknown[], _i: number, _p: number) => 0,
    };

    // eslint-disable-next-line no-new-func
    const factory = new Function(jsSource) as () => (b: Record<string, number>, bars: Record<string, number>[], idx: number, ind: unknown) => number;
    const fn = factory();
    return (bar, bars, idx) => fn(bar, bars, idx, indicators);
  }
}
