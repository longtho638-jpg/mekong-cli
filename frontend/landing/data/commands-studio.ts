import type { CommandData } from "./commands"

export const COMMANDS_STUDIO: CommandData[] = [
  { id: "portfolio-create", layer: "studio", displayName: "Portfolio Create", description: "Create portfolio company with OpenClaw CTO", complexity: "standard", creditCost: 3, agents: ["cto"] },
  { id: "portfolio-status", layer: "studio", displayName: "Portfolio Status", description: "Portfolio company health dashboard", complexity: "simple", creditCost: 1, agents: ["operator"] },
  { id: "dealflow-source", layer: "studio", displayName: "Deal Sourcing", description: "AI-powered deal sourcing matching thesis", complexity: "complex", creditCost: 5, agents: ["hunter", "data"] },
  { id: "dealflow-screen", layer: "studio", displayName: "Deal Screening", description: "Score deals against investment thesis", complexity: "standard", creditCost: 3, agents: ["cfo"] },
  { id: "venture-five-factors", layer: "studio", displayName: "Five Factors 道天地將法", description: "Sun Tzu five-factor evaluation", complexity: "complex", creditCost: 5, agents: ["cfo", "cto", "data"] },
  { id: "venture-terrain", layer: "studio", displayName: "Terrain Analysis 地形", description: "Market terrain classification (6 types)", complexity: "standard", creditCost: 3, agents: ["data"] },
  { id: "venture-momentum", layer: "studio", displayName: "Momentum Score 勢", description: "Market/company momentum scoring", complexity: "standard", creditCost: 3, agents: ["data", "cfo"] },
  { id: "venture-void-substance", layer: "studio", displayName: "Void-Substance 虚実", description: "Market gap analysis — voids vs occupied", complexity: "standard", creditCost: 3, agents: ["data", "cto"] },
  { id: "expert-match", layer: "studio", displayName: "Expert Match", description: "Match expert to company need", complexity: "standard", creditCost: 3, agents: ["merchant"] },
  { id: "match-vc-startup", layer: "studio", displayName: "VC-Startup Match", description: "Generate VC recommendations for company", complexity: "standard", creditCost: 3, agents: ["cfo", "merchant"] },
]
