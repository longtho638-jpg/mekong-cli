// Real counts from v5.0 architecture
// 319 commands (230 base + 89 super), 463 skills, 127 agents, 18 hubs, 85 DAG recipes

export const STATS = {
  commands: 319,
  superCommands: 89,
  skills: 463,
  agents: 127,
  hubs: 18,
  recipes: 85,
  layers: 5,
  roles: 32,
} as const

export type Stats = typeof STATS
