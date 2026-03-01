/**
 * @agencyos/gaming-hub-sdk — Unified Gaming & Esports Hub
 *
 * Facade consolidating matchmaking, tournaments, in-game economy,
 * leaderboards, battle passes, and item marketplace.
 *
 * Quick Start:
 *   import { createMatchmaker, createTournamentManager, createVirtualEconomy } from '@agencyos/gaming-hub-sdk';
 *
 * Sub-path imports:
 *   import { createMatchmaker } from '@agencyos/gaming-hub-sdk/matchmaking';
 *   import { createTournamentManager } from '@agencyos/gaming-hub-sdk/tournament';
 *   import { createVirtualEconomy } from '@agencyos/gaming-hub-sdk/economy';
 */

export { createMatchmaker, createLeaderboardManager } from './matchmaking-facade';
export type { Player, Match, Leaderboard } from './matchmaking-facade';

export { createTournamentManager } from './tournament-facade';
export type { Tournament, TournamentBracket } from './tournament-facade';

export { createVirtualEconomy, createBattlePassManager } from './economy-facade';
export type { VirtualCurrency, GameItem, BattlePass } from './economy-facade';
