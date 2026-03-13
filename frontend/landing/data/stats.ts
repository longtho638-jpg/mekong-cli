// Real counts from v6.0 architecture — Studio Platform
// 319 commands (230 base + 89 super), 463 skills, 127 agents, 18 hubs, 85 DAG recipes
// v6.0: Added VC Studio Platform (portfolio, dealflow, expert matching)

export const STATS = {
  commands: 319,
  superCommands: 89,
  skills: 463,
  agents: 127,
  hubs: 18,
  recipes: 85,
  layers: 6,  // v6.0: Founder, Business, Product, Engineering, Operations, Studio
  roles: 32,
} as const

export type Stats = typeof STATS
