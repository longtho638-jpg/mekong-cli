import { EdgeFunctionDeployer } from '../../../../src/arbitrage/phase6_ghost/ws-sharding/edge-function-deployer';
import { ShardNode } from '../../../../src/arbitrage/phase6_ghost/types';

function makeShard(id = 'shard-0'): ShardNode {
  return {
    id,
    endpoint: `ws://edge-${id}:8080`,
    assignedSymbols: ['BTC/USDT'],
    connected: false,
    messageCount: 0,
    lastHeartbeat: Date.now(),
  };
}

describe('EdgeFunctionDeployer', () => {
  let deployer: EdgeFunctionDeployer;

  beforeEach(() => {
    deployer = new EdgeFunctionDeployer();
  });

  it('should deploy an edge connection', () => {
    const conn = deployer.deploy(makeShard());
    expect(conn.connected).toBe(true);
    expect(conn.shardId).toBe('shard-0');
    expect(deployer.getDeployedCount()).toBe(1);
  });

  it('should undeploy an edge connection', () => {
    deployer.deploy(makeShard());
    expect(deployer.undeploy('shard-0')).toBe(true);
    expect(deployer.getDeployedCount()).toBe(0);
  });

  it('should return false when undeploying non-existent shard', () => {
    expect(deployer.undeploy('nonexistent')).toBe(false);
  });

  it('should register message callback', () => {
    deployer.deploy(makeShard());
    const cb = jest.fn();
    expect(deployer.onMessage('shard-0', cb)).toBe(true);
  });

  it('should return false for callback on non-existent shard', () => {
    expect(deployer.onMessage('nonexistent', jest.fn())).toBe(false);
  });

  it('should simulate message delivery', () => {
    deployer.deploy(makeShard());
    const cb = jest.fn();
    deployer.onMessage('shard-0', cb);

    const sent = deployer.simulateMessage('shard-0', 'BTC/USDT', 'trade', { price: 50000 });
    expect(sent).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);

    const msg = cb.mock.calls[0][0];
    expect(msg.shardId).toBe('shard-0');
    expect(msg.symbol).toBe('BTC/USDT');
    expect(msg.type).toBe('trade');
    expect(msg.sequence).toBe(1);
  });

  it('should increment sequence per shard', () => {
    deployer.deploy(makeShard());
    const cb = jest.fn();
    deployer.onMessage('shard-0', cb);

    deployer.simulateMessage('shard-0', 'BTC/USDT', 'trade', {});
    deployer.simulateMessage('shard-0', 'BTC/USDT', 'trade', {});

    expect(cb.mock.calls[0][0].sequence).toBe(1);
    expect(cb.mock.calls[1][0].sequence).toBe(2);
  });

  it('should return false for message to non-existent shard', () => {
    expect(deployer.simulateMessage('ghost', 'BTC/USDT', 'trade', {})).toBe(false);
  });

  it('should return false for message to shard without callback', () => {
    deployer.deploy(makeShard());
    // No callback registered
    expect(deployer.simulateMessage('shard-0', 'BTC/USDT', 'trade', {})).toBe(false);
  });

  it('should check connection status', () => {
    expect(deployer.isConnected('shard-0')).toBe(false);
    deployer.deploy(makeShard());
    expect(deployer.isConnected('shard-0')).toBe(true);
  });

  it('should deploy multiple shards', () => {
    deployer.deploy(makeShard('shard-0'));
    deployer.deploy(makeShard('shard-1'));
    deployer.deploy(makeShard('shard-2'));
    expect(deployer.getDeployedCount()).toBe(3);
  });
});
