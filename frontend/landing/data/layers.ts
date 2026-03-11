export interface LayerData {
  id: string
  chapter: string
  role: string
  description: string
  icon: string
  commands: string[]
  cascadesTo: string[]
  entryPrompt: string
  color: string
}

export const LAYERS: LayerData[] = [
  {
    id: "founder",
    chapter: "始計 — Initial Calculations",
    role: "Founder / CEO",
    description: "Strategic vision, fundraising, OKRs, financial goals. The apex of the pyramid.",
    icon: "👑",
    // prettier-ignore
    commands: ["annual","quarterly","okr","goals","goal-dashboard","kpi","forecast","financial-report","branding","cofounder","credits","launch","tier-pricing","swot","portfolio","founder-validate","founder-metrics","founder-week","founder-brand","founder-legal","unit-economics","tam","moat-audit","founder-pitch","founder-vc-map","raise","fundraise","data-room","financial-model","founder-vc-cap-table","founder-vc-term-sheet","founder-vc-negotiate","founder-vc-bootstrap","dilution-sim","founder-grow","founder-hire","runway","investor-update","founder-secondary","founder-ipo-pre-ipo-prep","founder-ipo-s1","founder-ipo-roadshow","founder-ipo-ipo-day","founder-ipo-public-co","founder-ipo-insider","founder-ipo-succession","founder-raise","founder-validate-sprint","founder-launch","founder-weekly","founder-negotiate","founder-ipo"],
    cascadesTo: ["business"],
    entryPrompt: "You're the founder. Strategy, finance, or goals today?",
    color: "yellow-400",
  },
  {
    id: "business",
    chapter: "作戰 — Waging War",
    role: "Business Lead / GTM",
    description: "Sales, marketing, finance, HR, client ops. Revenue engine layer.",
    icon: "🏢",
    // prettier-ignore
    commands: ["ads","affiliate","cashflow","campaign","client","close","content","contract","crm","performance-review","partnerships","email","expense","finance","agreement","hr","invoice","invoice-gen","marketing-plan","customer-research","leadgen","schedule","marketing","budget","hr-management","market-analysis","pipeline","revenue","sales","seo","social","tax","business-revenue-engine","business-quarterly-review","business-hiring-sprint","business-campaign-launch","business-financial-close","business-client-onboard","sales-pipeline-build","sales-deal-close","sales-weekly-review","marketing-content-engine","marketing-campaign-run","marketing-performance-report","finance-monthly-close","finance-budget-plan","finance-collections","hr-recruit","hr-performance-cycle","hr-onboard","legal-contract-review","legal-compliance-check"],
    cascadesTo: ["product"],
    entryPrompt: "Business layer. Sales, marketing, finance, or HR?",
    color: "blue-400",
  },
  {
    id: "product",
    chapter: "謀攻 — Attack by Stratagem",
    role: "Product Manager / Designer",
    description: "Roadmap, sprints, personas, proposals, demos. Bridge between biz and eng.",
    icon: "📦",
    // prettier-ignore
    commands: ["general-report","brainstorm","competitor","demo","project-management","estimate","feedback","handoff","persona","plan","proposal","retrospective","roadmap","scope","sprint","standup","product-discovery","product-sprint-plan","product-launch-feature","product-competitive-intel","product-retrospective","design-user-research","design-sprint"],
    cascadesTo: ["engineering"],
    entryPrompt: "Product layer. Roadmap, sprint, scope, or brainstorm?",
    color: "purple-400",
  },
  {
    id: "engineering",
    chapter: "軍爭 — Military Contention",
    role: "Engineer / Tech Lead",
    description: "Code, build, test, deploy, review. The execution powerhouse.",
    icon: "⚙️",
    // prettier-ignore
    commands: ["api","arch","code","component","cook","coverage","debug","deploy","deploy-prod","deploy-staging","docs","docs-api","docs-arch","docs-changelog","docs-deploy","docs-onboard","docs-readme","e2e-test","fix","format","git","git-bisect","git-branch","git-cherry","git-merge","git-rebase","git-squash","git-stash","git-tag","integration-test","journal","kanban","lint","migrate","optimize","pr","refactor","review","schema","seed","ship","test","typecheck","unit-test","vibe-code","vibe-cook","watzup","engineering-ship","engineering-refactor","engineering-incident","engineering-new-service","eng-sprint-execute","eng-tech-debt","eng-onboard-dev","tech-architecture-review","tech-api-design","tech-migration"],
    cascadesTo: ["ops"],
    entryPrompt: "Engineering layer. Cook, fix, test, review, or deploy?",
    color: "green-400",
  },
  {
    id: "ops",
    chapter: "九變 — Nine Variations",
    role: "DevOps / Platform",
    description: "Audit, health, security, sync, environment. The foundation layer.",
    icon: "🔧",
    // prettier-ignore
    commands: ["audit","benchmark","bootstrap-auto","bootstrap-auto-fast","bootstrap-auto-parallel","clean","company-agent","company-billing","company-init","company-report","company-run","company-workflow","env","health","help","init","install","raas","raas-billing","raas-bootstrap","raas-bootstrap-auto","raas-bootstrap-auto-parallel","raas-bootstrap-parallel","raas-deploy","raas-mission","raas-status","report","rollback","security","setup-mcp","smoke","status","sync-agent","sync-all","sync-providers","sync-artifacts","sync-browser","sync-editor","sync-mcp","sync-rules","sync-tasks","update","use-mcp","win-check","ops-health-sweep","ops-security-audit","ops-sync-all","ops-disaster-recovery","devops-deploy-pipeline","devops-rollback","platform-monitoring-setup","platform-environment-setup","release-ship","release-hotfix"],
    cascadesTo: [],
    entryPrompt: "Ops layer. Audit, health check, security, or sync?",
    color: "orange-400",
  },
] as const
