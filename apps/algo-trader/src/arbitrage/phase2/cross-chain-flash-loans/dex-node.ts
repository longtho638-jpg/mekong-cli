/**
 * DEX Node — graph vertex representing a trading pair on a specific chain/protocol.
 * BridgeEdge — directed edge connecting two DEX nodes across chains via a bridge.
 */

export interface DexNode {
  id: string;            // e.g. "uniswapV3:ETH/USDC"
  chain: 'ethereum' | 'solana' | 'bsc';
  protocol: string;      // "uniswapV3", "raydium", "pancakeswap"
  symbol: string;        // "ETH/USDC"
  liquidity: number;     // available liquidity in USD
  feePct: number;        // swap fee as decimal (e.g. 0.003 = 0.3%)
  gasEstimateUsd: number;
}

export interface BridgeEdge {
  from: DexNode;
  to: DexNode;
  bridgeProtocol: string; // "wormhole", "axelar", "stargate"
  bridgeFeeUsd: number;
  bridgeTimeMs: number;
  maxAmount: number;      // max transfer amount in USD
}

/**
 * Registry of all known DEX nodes and cross-chain bridge edges.
 * Acts as the adjacency list of the routing graph.
 */
export class DexRegistry {
  private nodes: Map<string, DexNode> = new Map();
  private bridges: Map<string, BridgeEdge> = new Map();

  registerDex(node: DexNode): void {
    this.nodes.set(node.id, node);
  }

  registerBridge(bridge: BridgeEdge): void {
    const key = `${bridge.from.id}::${bridge.to.id}::${bridge.bridgeProtocol}`;
    this.bridges.set(key, bridge);
  }

  getNode(id: string): DexNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): DexNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Returns all bridge edges connecting fromChain → toChain.
   */
  getBridges(fromChain: string, toChain: string): BridgeEdge[] {
    const result: BridgeEdge[] = [];
    for (const bridge of this.bridges.values()) {
      if (bridge.from.chain === fromChain && bridge.to.chain === toChain) {
        result.push(bridge);
      }
    }
    return result;
  }

  getBridgeCount(): number {
    return this.bridges.size;
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  clear(): void {
    this.nodes.clear();
    this.bridges.clear();
  }
}
