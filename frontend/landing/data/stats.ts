// Real counts from architecture: 289 base + 25 C-level super + 36 manager super = 350 commands
// 127 agents, 216 skills, 5 layers (founder / business / product / engineering / ops)
// commits: approximate, updated periodically

export const STATS = {
  commands: 358,
  agents: 127,
  skills: 216,
  layers: 5,
  commits: 2000,
} as const

export type Stats = typeof STATS
