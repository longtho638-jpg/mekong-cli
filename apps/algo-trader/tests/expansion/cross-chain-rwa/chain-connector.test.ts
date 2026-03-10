import { ChainConnector } from '../../../src/expansion/cross-chain-rwa/chain-connector';

describe('ChainConnector', () => {
  it('connectAll resolves all known chains', async () => {
    const connector = new ChainConnector(['ethereum', 'solana', 'bsc']);
    const statuses = await connector.connectAll();
    expect(statuses).toHaveLength(3);
    statuses.forEach((s) => expect(s.connected).toBe(true));
  });

  it('unknown chain connects as disconnected', async () => {
    const connector = new ChainConnector(['unknownchain']);
    const statuses = await connector.connectAll();
    expect(statuses[0].connected).toBe(false);
  });

  it('isConnected returns true after connectAll', async () => {
    const connector = new ChainConnector(['ethereum']);
    await connector.connectAll();
    expect(connector.isConnected('ethereum')).toBe(true);
  });

  it('isConnected returns false before connectAll', () => {
    const connector = new ChainConnector(['ethereum']);
    expect(connector.isConnected('ethereum')).toBe(false);
  });

  it('disconnect marks chain as disconnected', async () => {
    const connector = new ChainConnector(['ethereum']);
    await connector.connectAll();
    connector.disconnect('ethereum');
    expect(connector.isConnected('ethereum')).toBe(false);
  });

  it('emits chain-connected for each chain', async () => {
    const connector = new ChainConnector(['ethereum', 'solana']);
    const events: unknown[] = [];
    connector.on('chain-connected', (s) => events.push(s));
    await connector.connectAll();
    expect(events).toHaveLength(2);
  });

  it('getConnectedChains returns only connected chains', async () => {
    const connector = new ChainConnector(['ethereum', 'solana']);
    await connector.connectAll();
    connector.disconnect('solana');
    expect(connector.getConnectedChains()).toEqual(['ethereum']);
  });
});
