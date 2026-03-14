// 342 commands (284 base + 23 studio + 35 super), 463 skills, 127 agents, 19 hubs, 103 DAG recipes
// v6.0: Studio → Founder → Business → Product → Engineering → Ops

export const STATS = {
  commands: 342,
  superCommands: 94,
  skills: 463,
  agents: 127,
  hubs: 19,
  recipes: 103,
  layers: 6,
  roles: 32,
  version: '6.0',
} as const

export type Stats = typeof STATS
