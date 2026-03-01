/**
 * @agencyos/web3-hub-sdk — Unified Web3 & Crypto Hub
 *
 * Facade consolidating multi-chain wallet management, DeFi protocols,
 * NFT marketplace, token economics, and smart contract interactions.
 *
 * Quick Start:
 *   import { createWalletManager, createDeFiManager, createNFTMarketplace } from '@agencyos/web3-hub-sdk';
 *
 * Sub-path imports:
 *   import { createWalletManager } from '@agencyos/web3-hub-sdk/wallet';
 *   import { createDeFiManager } from '@agencyos/web3-hub-sdk/defi';
 *   import { createNFTMarketplace } from '@agencyos/web3-hub-sdk/nft';
 */

export { createWalletManager } from './wallet-facade';
export type { Wallet, Transaction } from './wallet-facade';

export { createDeFiManager } from './defi-facade';
export type { LiquidityPool, StakePosition } from './defi-facade';

export { createNFTMarketplace } from './nft-facade';
export type { NFT, NFTListing, NFTCollection } from './nft-facade';
