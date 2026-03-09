import { TokenDeployer } from '../../../src/expansion/dao-governance/token-deployer';

describe('TokenDeployer', () => {
  it('deploy returns a valid deployment record', async () => {
    const deployer = new TokenDeployer({ symbol: 'ALGO' });
    const deployment = await deployer.deploy();
    expect(deployment.symbol).toBe('ALGO');
    expect(deployment.contractAddress).toMatch(/^0x[0-9a-f]{40}$/i);
    expect(deployment.totalSupply).toBeGreaterThan(0n);
    expect(deployment.deployedAt).toBeGreaterThan(0);
  });

  it('deploy is idempotent — returns same deployment on second call', async () => {
    const deployer = new TokenDeployer({ symbol: 'ALGO' });
    const first = await deployer.deploy();
    const second = await deployer.deploy();
    expect(second.contractAddress).toBe(first.contractAddress);
  });

  it('isDeployed returns false before deploy', () => {
    const deployer = new TokenDeployer({ symbol: 'ALGO' });
    expect(deployer.isDeployed()).toBe(false);
  });

  it('isDeployed returns true after deploy', async () => {
    const deployer = new TokenDeployer({ symbol: 'ALGO' });
    await deployer.deploy();
    expect(deployer.isDeployed()).toBe(true);
  });

  it('getDeployment returns null before deploy', () => {
    const deployer = new TokenDeployer({ symbol: 'ALGO' });
    expect(deployer.getDeployment()).toBeNull();
  });

  it('emits deployed event', async () => {
    const deployer = new TokenDeployer({ symbol: 'ALGO' });
    const events: unknown[] = [];
    deployer.on('deployed', (d) => events.push(d));
    await deployer.deploy();
    expect(events).toHaveLength(1);
  });

  it('uses custom name when provided', async () => {
    const deployer = new TokenDeployer({ symbol: 'TEST', name: 'Test Token' });
    const deployment = await deployer.deploy();
    expect(deployment.name).toBe('Test Token');
  });

  it('uses custom totalSupply when provided', async () => {
    const deployer = new TokenDeployer({ symbol: 'TEST', totalSupply: 500n });
    const deployment = await deployer.deploy();
    expect(deployment.totalSupply).toBe(500n);
  });
});
