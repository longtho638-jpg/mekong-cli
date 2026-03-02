/**
 * Scope definitions and checker for tenant auth
 */

export const SCOPES = {
  BACKTEST: 'backtest',
  LIVE_TRADE: 'live:trade',
  LIVE_MONITOR: 'live:monitor',
  ADMIN: 'admin',
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

export const ALL_SCOPES: Scope[] = [
  SCOPES.BACKTEST,
  SCOPES.LIVE_TRADE,
  SCOPES.LIVE_MONITOR,
  SCOPES.ADMIN,
];

/**
 * Check if required scope is present in actual scopes.
 * 'admin' scope grants access to everything.
 */
export function hasScope(required: string, actual: string[]): boolean {
  if (actual.includes(SCOPES.ADMIN)) return true;
  return actual.includes(required);
}

/**
 * Check if all required scopes are present.
 */
export function hasAllScopes(required: string[], actual: string[]): boolean {
  if (actual.includes(SCOPES.ADMIN)) return true;
  return required.every((scope) => actual.includes(scope));
}

/**
 * Validate that provided scope strings are valid.
 */
export function validateScopes(scopes: string[]): scopes is Scope[] {
  return scopes.every((s) => ALL_SCOPES.includes(s as Scope));
}
