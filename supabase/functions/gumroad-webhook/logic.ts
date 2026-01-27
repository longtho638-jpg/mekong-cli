
export function calculateTier(total: number): string {
  if (total >= 25) return 'platinum';
  if (total >= 10) return 'gold';
  if (total >= 3) return 'silver';
  if (total >= 1) return 'bronze';
  return 'bronze';
}

export const TIERS = {
  bronze: { min: 1, reward: 'commands-cheatsheet.pdf' },
  silver: { min: 3, reward: 'consulting-session-calendly' },
  gold: { min: 10, reward: 'agencyos-pro-license' },
  platinum: { min: 25, reward: 'revenue-share-contract' }
};
