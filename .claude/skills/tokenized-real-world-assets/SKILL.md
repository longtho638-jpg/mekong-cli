---
name: tokenized-real-world-assets
description: "RWA tokenization, security tokens, fractional ownership, on-chain real estate/art/commodities — activate when building tokenization platforms, security token offerings, or DeFi integrations with physical assets"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Tokenized Real-World Assets — Skill

> RWA tokenization surpassed $10B TVL in 2025; BlackRock BUIDL and Ondo Finance led institutional adoption of on-chain T-bills and real estate.

## When to Activate
- Building a security token offering (STO) platform
- Implementing fractional ownership of real estate, art, or commodities
- Integrating DeFi protocols with physical asset backing
- Developing on-chain compliance (KYC/AML) for regulated tokens
- Creating tokenized fund structures (money market, credit, equity)
- Designing cross-chain RWA bridges or oracles
- Auditing smart contracts for asset-backed token standards (ERC-1400, ERC-3643)

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Token Standards | ERC-1400, ERC-3643 (T-REX), ERC-4626 vault wrappers | OpenZeppelin, TokenySolutions |
| Compliance Layer | On-chain KYC/AML, transfer restrictions, investor accreditation | Securitize DS Protocol, Polymath |
| Asset Oracles | Real-time NAV feeds, price oracles for physical assets | Chainlink, Pyth Network |
| Fractional Ownership | SPV structuring, cap table management, dividend distribution | Centrifuge, Maple Finance |
| Secondary Markets | Regulated ATS integration, liquidity pools for security tokens | tZERO, INX, Ondo Finance |

## Architecture Patterns
```
[Asset Originator]
      │ legal wrapper (SPV/trust)
      ▼
[Smart Contract — ERC-3643 Token]
      │ compliance checks on every transfer
      ▼
[Identity Registry] ← [KYC Provider (Securitize/Onfido)]
      │
      ▼
[Investor Wallet] ←→ [Secondary Market / DEX with compliance hooks]
      │
      ▼
[Oracle: NAV / Price Feed] → [On-chain Proof of Reserve]
```

```solidity
// ERC-3643 compliant transfer with compliance check
function transfer(address to, uint256 amount) public returns (bool) {
    require(identityRegistry.isVerified(to), "Recipient not KYC'd");
    require(compliance.canTransfer(msg.sender, to, amount), "Compliance rejected");
    _transfer(msg.sender, to, amount);
    emit Transfer(msg.sender, to, amount);
    return true;
}
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Securitize | Full-stack STO platform, cap table, ATS | Revenue share + setup fee |
| Polymath | ERC-3643 token issuance, compliance modules | Per-issuance fee |
| tZERO | Secondary market trading for security tokens | Commission-based ATS |
| Centrifuge | Real-world credit/invoice tokenization on Polkadot/EVM | Protocol fee on assets |
| Ondo Finance | Tokenized US T-bills (OUSG, USDY), institutional DeFi | Management fee (0.15–0.35%) |

## Related Skills
- `defi-protocol-engineering` — DeFi integrations for RWA liquidity pools
- `smart-contract-security` — Auditing ERC-1400/3643 compliance logic
- `databases` — Off-chain cap table and investor registry storage
