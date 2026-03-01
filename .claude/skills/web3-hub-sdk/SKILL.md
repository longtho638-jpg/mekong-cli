---
name: web3-hub-sdk
description: Unified Web3 SDK — crypto wallets, DeFi protocols, NFT minting, smart contracts, token economics. Use for blockchain apps, DeFi platforms, NFT marketplaces, DAO tooling.
license: MIT
version: 1.0.0
---

# Web3 Hub SDK Skill

Build blockchain applications, DeFi protocols, NFT marketplaces, and DAO governance tools.

## When to Use

- Crypto wallet creation and transaction signing
- DeFi protocol integration (swap, lend, stake)
- NFT minting, transfer, and marketplace listing
- Smart contract deployment and interaction
- Token economics and vesting schedules
- DAO governance and on-chain voting

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/web3-hub-sdk/wallet` | WalletFacade | Wallets, keys, transactions |
| `@agencyos/web3-hub-sdk/defi` | DeFiFacade | Swap, lend, stake, yield |
| `@agencyos/web3-hub-sdk/nft` | NFTFacade | Mint, transfer, marketplace |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-web3` | Core blockchain engine |
| `@agencyos/vibe-defi` | DeFi protocol adapters |
| `@agencyos/vibe-nft` | NFT lifecycle management |

## Usage

```typescript
import { createWalletManager, createDeFiEngine, createNFTManager } from '@agencyos/web3-hub-sdk';

const wallet = await createWalletManager().connect({
  provider: 'metamask',
  chainId: 1,
});

const swap = await createDeFiEngine().swap({
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '0.5',
  slippage: 0.5,
});

const nft = await createNFTManager().mint({
  contract: '0xabc...',
  recipient: wallet.address,
  metadata: { name: 'Art #001', image: 'ipfs://...' },
});
```

## Key Types

- `Wallet` — address, balance, chain, signer
- `SwapQuote` — route, price impact, gas estimate
- `NFTToken` — tokenId, metadata, ownership history
- `SmartContract` — ABI, address, deployed chain

## Related Skills

- `fintech` — Financial transaction patterns
- `identity-compliance-hub-sdk` — KYC/AML for Web3
