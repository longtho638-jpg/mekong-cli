// Real counts from architecture: 289 commands, 127 agents, 216 skills.
// +19 super commands added (business x6, product x5, engineering x4, ops x4)
// layers: 5 (founder / business / product / engineering / ops)
// commits: approximate, updated periodically

export const STATS = {
  commands: 322,
  agents: 127,
  skills: 216,
  layers: 5,
  commits: 2000,
} as const

export type Stats = typeof STATS
