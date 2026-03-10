/**
 * Context-Free Grammar for trading strategy ASTs.
 * Defines node types and grammar rules for genetic programming.
 * All nodes are pure value objects (no methods) for easy cloning.
 */

// ── AST Node Types ──────────────────────────────────────────────────────────

export interface PriceNode {
  type: 'price';
  field: 'open' | 'high' | 'low' | 'close' | 'vwap';
  lag: number; // 0 = current bar
}

export interface IndicatorNode {
  type: 'indicator';
  name: 'sma' | 'ema' | 'rsi' | 'macd' | 'atr';
  period: number;
}

export interface BinaryOpNode {
  type: 'binary';
  op: '+' | '-' | '*' | '/' | '>' | '<' | '>=' | '<=' | '==';
  left: AstNode;
  right: AstNode;
}

export interface UnaryOpNode {
  type: 'unary';
  op: 'neg' | 'abs' | 'log';
  operand: AstNode;
}

export interface ConditionNode {
  type: 'condition';
  test: AstNode;
  consequent: AstNode; // value if test != 0
  alternate: AstNode; // value if test == 0
}

export type AstNode =
  | PriceNode
  | IndicatorNode
  | BinaryOpNode
  | UnaryOpNode
  | ConditionNode;

// ── Grammar Config ───────────────────────────────────────────────────────────

export interface GrammarRule {
  /** Probability weight for choosing this production (relative). */
  weight: number;
  /** Factory producing an AST node of this rule's type. */
  produce: (depth: number, rng: () => number) => AstNode;
}

export interface GrammarConfig {
  maxDepth: number;
  terminalProbability: number; // 0..1, raised as depth increases
}

const DEFAULT_GRAMMAR_CONFIG: GrammarConfig = {
  maxDepth: 5,
  terminalProbability: 0.4,
};

// ── Terminal production helpers ──────────────────────────────────────────────

function randomPriceNode(rng: () => number): PriceNode {
  const fields: PriceNode['field'][] = ['open', 'high', 'low', 'close', 'vwap'];
  return {
    type: 'price',
    field: fields[Math.floor(rng() * fields.length)],
    lag: Math.floor(rng() * 5),
  };
}

function randomIndicatorNode(rng: () => number): IndicatorNode {
  const names: IndicatorNode['name'][] = ['sma', 'ema', 'rsi', 'macd', 'atr'];
  return {
    type: 'indicator',
    name: names[Math.floor(rng() * names.length)],
    period: 5 + Math.floor(rng() * 46), // 5..50
  };
}

// ── Grammar rules (exported for tests) ──────────────────────────────────────

export const GRAMMAR_RULES: GrammarRule[] = [
  { weight: 30, produce: (_d, rng) => randomPriceNode(rng) },
  { weight: 30, produce: (_d, rng) => randomIndicatorNode(rng) },
  {
    weight: 20,
    produce: (d, rng) => ({
      type: 'binary',
      op: (['+', '-', '*', '>', '<'] as BinaryOpNode['op'][])[Math.floor(rng() * 5)],
      left: randomExpression(d + 1, rng),
      right: randomExpression(d + 1, rng),
    } as BinaryOpNode),
  },
  {
    weight: 10,
    produce: (d, rng) => ({
      type: 'unary',
      op: (['neg', 'abs', 'log'] as UnaryOpNode['op'][])[Math.floor(rng() * 3)],
      operand: randomExpression(d + 1, rng),
    } as UnaryOpNode),
  },
  {
    weight: 10,
    produce: (d, rng) => ({
      type: 'condition',
      test: randomExpression(d + 1, rng),
      consequent: randomExpression(d + 1, rng),
      alternate: randomExpression(d + 1, rng),
    } as ConditionNode),
  },
];

// ── Public functions ─────────────────────────────────────────────────────────

/**
 * Generate a random strategy expression (AST).
 * Uses cfg.maxDepth to limit tree growth.
 */
export function randomExpression(
  depth = 0,
  rng: () => number = Math.random,
  cfg: GrammarConfig = DEFAULT_GRAMMAR_CONFIG,
): AstNode {
  const forceTerminal = depth >= cfg.maxDepth || rng() < cfg.terminalProbability + depth * 0.1;

  if (forceTerminal) {
    return rng() < 0.5 ? randomPriceNode(rng) : randomIndicatorNode(rng);
  }

  // Weighted random rule selection
  const totalWeight = GRAMMAR_RULES.reduce((s, r) => s + r.weight, 0);
  let pick = rng() * totalWeight;
  for (const rule of GRAMMAR_RULES) {
    pick -= rule.weight;
    if (pick <= 0) return rule.produce(depth, rng);
  }
  return randomPriceNode(rng);
}

/** Deep clone an AST node. */
function cloneNode(node: AstNode): AstNode {
  return JSON.parse(JSON.stringify(node)) as AstNode;
}

/** Collect all nodes in BFS order (for mutation point selection). */
function collectNodes(root: AstNode): AstNode[] {
  const result: AstNode[] = [root];
  if (root.type === 'binary') {
    result.push(...collectNodes(root.left), ...collectNodes(root.right));
  } else if (root.type === 'unary') {
    result.push(...collectNodes(root.operand));
  } else if (root.type === 'condition') {
    result.push(...collectNodes(root.test), ...collectNodes(root.consequent), ...collectNodes(root.alternate));
  }
  return result;
}

/**
 * Mutate an expression by replacing a random subtree.
 * Returns a new AST (does not modify original).
 */
export function mutateExpression(
  root: AstNode,
  rng: () => number = Math.random,
  cfg: GrammarConfig = DEFAULT_GRAMMAR_CONFIG,
): AstNode {
  const nodes = collectNodes(root);
  const targetIdx = Math.floor(rng() * nodes.length);
  const target = nodes[targetIdx];
  const replacement = randomExpression(0, rng, cfg);

  // Replace by rebuilding tree with substitution
  function substituteNode(node: AstNode): AstNode {
    if (node === target) return replacement;
    if (node.type === 'binary') {
      return { ...node, left: substituteNode(node.left), right: substituteNode(node.right) };
    }
    if (node.type === 'unary') {
      return { ...node, operand: substituteNode(node.operand) };
    }
    if (node.type === 'condition') {
      return {
        ...node,
        test: substituteNode(node.test),
        consequent: substituteNode(node.consequent),
        alternate: substituteNode(node.alternate),
      };
    }
    return cloneNode(node);
  }

  return substituteNode(cloneNode(root));
}

/**
 * Crossover: swap random subtrees between two parent ASTs.
 * Returns [child1, child2].
 */
export function crossover(
  parent1: AstNode,
  parent2: AstNode,
  rng: () => number = Math.random,
): [AstNode, AstNode] {
  const nodes1 = collectNodes(parent1);
  const nodes2 = collectNodes(parent2);

  const sub1 = nodes1[Math.floor(rng() * nodes1.length)];
  const sub2 = nodes2[Math.floor(rng() * nodes2.length)];

  function replace(root: AstNode, target: AstNode, replacement: AstNode): AstNode {
    if (root === target) return cloneNode(replacement);
    if (root.type === 'binary') {
      return { ...root, left: replace(root.left, target, replacement), right: replace(root.right, target, replacement) };
    }
    if (root.type === 'unary') {
      return { ...root, operand: replace(root.operand, target, replacement) };
    }
    if (root.type === 'condition') {
      return {
        ...root,
        test: replace(root.test, target, replacement),
        consequent: replace(root.consequent, target, replacement),
        alternate: replace(root.alternate, target, replacement),
      };
    }
    return cloneNode(root);
  }

  const child1 = replace(cloneNode(parent1), sub1, sub2);
  const child2 = replace(cloneNode(parent2), sub2, sub1);
  return [child1, child2];
}
