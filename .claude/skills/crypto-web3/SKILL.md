---
name: crypto-web3
description: Smart contracts, wallet SDKs, DeFi protocols, NFT infrastructure, blockchain data indexing, cross-chain bridges, Web3 auth. Use for dApps, DeFi, NFT platforms, crypto payments.
license: MIT
version: 1.0.0
---

# Crypto & Web3 Development Skill

Build decentralized applications, DeFi protocols, NFT platforms, and Web3 infrastructure with modern blockchain tooling.

## When to Use

- Smart contract development (Solidity, Rust/Move)
- Wallet integration and embedded wallet SDKs
- DeFi protocol integration (swaps, lending, staking)
- NFT minting, marketplace, and metadata
- Blockchain data indexing and analytics
- Cross-chain bridge integration
- Web3 authentication (SIWE, passkeys)
- Token launch and tokenomics design
- Stablecoin payment rails
- DAO governance and voting systems

## Tool Selection

| Need | Choose |
|------|--------|
| Smart contract (EVM) | Hardhat (JS ecosystem), Foundry (fast Solidity tests) |
| Smart contract (Solana) | Anchor (Rust framework) |
| Wallet SDK (embedded) | Privy (Stripe-owned), thirdweb, Web3Auth |
| Wallet connection | WalletConnect v2 (700+ wallets) |
| Account abstraction | Dynamic (Fireblocks), Openfort, Turnkey |
| DEX integration | Uniswap V4 SDK, PancakeSwap SDK |
| Lending protocol | Aave SDK, Compound API |
| NFT (Solana) | Metaplex Core (80% cheaper minting) |
| NFT (multi-chain) | Reservoir (aggregator), OpenSea API |
| Blockchain data | The Graph (GraphQL), Dune (SQL), Alchemy |
| Node provider | Alchemy, Infura, QuickNode, Helius (Solana) |
| Cross-chain bridge | Portal (Wormhole), deBridge (zero exploits) |
| Crypto payments | Stripe Crypto (1.5% USDC), Circle USDC APIs |
| Web3 auth | SIWE (EIP-4361), Privy, Web3Auth |

## Web3 Architecture

```
User (Browser / Mobile)
    ↓
┌────────────────────────────────────────────┐
│  Frontend (Next.js + wagmi/viem)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Wallet   │  │ Contract │  │ Token    │ │
│  │ Connect  │  │ Interact │  │ Balance  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  Smart Contracts (On-Chain)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Token    │  │ DEX/AMM  │  │ NFT      │ │
│  │ ERC-20   │  │ Pool     │  │ ERC-721  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Indexer  │  │ Oracle   │  │ Bridge   │
│ (Graph)  │  │ (Chain-  │  │ (Portal) │
│          │  │  link)   │  │          │
└──────────┘  └──────────┘  └──────────┘
```

## Foundry Smart Contract Development

```solidity
// src/Counter.sol
pragma solidity ^0.8.20;

contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}
```

```bash
# Foundry workflow (10-100x faster than Hardhat for tests)
forge init my-project
forge build                    # Compile
forge test -vvv                # Run tests (Solidity-native)
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast  # Deploy
```

## Chain Comparison

| Chain | TPS | Fees | Language | Best For |
|-------|-----|------|----------|----------|
| Ethereum | ~30 | $1-50 | Solidity | DeFi, high-value |
| Base | ~2000 | <$0.01 | Solidity (EVM) | Consumer apps (Coinbase L2) |
| Arbitrum | ~40K | <$0.10 | Solidity (EVM) | DeFi, gaming |
| Solana | ~65K | <$0.01 | Rust | Gaming, NFTs, high-speed |
| Sui | ~100K+ | <$0.01 | Move | Gaming, asset-centric |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| TVL | Total value locked in contracts | Growth indicator |
| Gas Efficiency | Gas used vs baseline | Optimize per function |
| Tx Success Rate | Successful / Total transactions | > 99% |
| Bridge Volume | Cross-chain transfer value | Liquidity depth |
| Wallet Activation | Connected / Visited users | > 30% |
| Smart Contract Audit | Vulnerabilities found / Total | 0 critical |
| Token Velocity | Volume / Market cap | Market health |
| NFT Floor Price | Lowest listing price | Collection metric |

## References

- Foundry: https://book.getfoundry.sh
- Hardhat: https://hardhat.org/docs
- Anchor: https://www.anchor-lang.com
- Privy: https://docs.privy.io
- WalletConnect: https://docs.walletconnect.com
- thirdweb: https://portal.thirdweb.com
- The Graph: https://thegraph.com/docs
- Alchemy: https://docs.alchemy.com
- Uniswap: https://docs.uniswap.org
- Metaplex: https://developers.metaplex.com
