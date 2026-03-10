import type { CommandData } from "./commands"

export const COMMANDS_ENGINEERING_C: CommandData[] = [
  {
    id: "journal",
    layer: "engineering",
    displayName: "Journal",
    description: "Dev journal — log work, decisions, learnings",
    complexity: "simple",
    creditCost: 1,
    agents: ["planner"],
  },
  {
    id: "kanban",
    layer: "engineering",
    displayName: "Kanban",
    description: "Kanban board — task tracking, status management",
    complexity: "standard",
    creditCost: 3,
    agents: ["project-manager"],
  },
  {
    id: "vibe-code",
    layer: "engineering",
    displayName: "Vibe Code",
    description: "Vibe Code — creative coding with AI assistance",
    complexity: "standard",
    creditCost: 3,
    agents: ["fullstack-developer"],
  },
  {
    id: "vibe-cook",
    layer: "engineering",
    displayName: "Vibe Cook",
    description: "Vibe Cook — experimental feature development",
    complexity: "standard",
    creditCost: 3,
    agents: ["planner", "fullstack-developer"],
  },
  {
    id: "watzup",
    layer: "engineering",
    displayName: "Watzup",
    description: "What's up — review recent changes, activity summary",
    complexity: "simple",
    creditCost: 1,
    agents: ["planner"],
  },
]
