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
    commands: ["annual","bao-cao-tai-chinh","branding","cofounder","credits","forecast","fundraise","goal-dashboard","kpi","launch","muc-tieu","okr","portfolio","pricing","quarterly","raise","swot","tier-pricing","founder-brand","founder-grow","founder-hire","founder-legal","founder-metrics","founder-pitch","founder-secondary","founder-validate","founder-vc-map","founder-week","founder-vc-bootstrap","founder-vc-cap-table","founder-vc-negotiate","founder-vc-term-sheet","founder-ipo-pre-ipo-prep","founder-ipo-s1","founder-ipo-roadshow","founder-ipo-ipo-day","founder-ipo-public-co","founder-ipo-insider","founder-ipo-succession"],
    cascadesTo: ["business"],
    entryPrompt: "Bạn là founder. Hôm nay muốn làm gì? Chiến lược, tài chính, hay mục tiêu?",
    color: "cyan-400",
  },
  {
    id: "business",
    chapter: "作戰 — Waging War",
    role: "Business Lead / GTM",
    description: "Sales, marketing, finance, HR, client ops. Revenue engine layer.",
    icon: "🏢",
    // prettier-ignore
    commands: ["ads","affiliate","cashflow","chien-dich","client","close","content","contract","crm","danh-gia","doi-tac","email","expense","finance","hop-dong","hr","invoice","invoice-gen","ke-hoach-tiep-thi","khach-hang","leadgen","lich-trinh","marketing","ngan-sach","nhan-su","phan-tich","pipeline","revenue","sales","seo","social","tax"],
    cascadesTo: ["product"],
    entryPrompt: "Layer kinh doanh. Sales, marketing, tài chính, hay nhân sự?",
    color: "blue-400",
  },
  {
    id: "product",
    chapter: "謀攻 — Attack by Stratagem",
    role: "Product Manager / Designer",
    description: "Roadmap, sprints, personas, proposals, demos. Bridge between biz and eng.",
    icon: "📦",
    // prettier-ignore
    commands: ["bao-cao","brainstorm","competitor","demo","du-an","estimate","feedback","handoff","persona","plan","proposal","retrospective","roadmap","scope","sprint","standup"],
    cascadesTo: ["engineering"],
    entryPrompt: "Layer sản phẩm. Roadmap, sprint, scope, hay brainstorm?",
    color: "purple-400",
  },
  {
    id: "engineering",
    chapter: "軍爭 — Military Contention",
    role: "Engineer / Tech Lead",
    description: "Code, build, test, deploy, review. The execution powerhouse.",
    icon: "⚙️",
    // prettier-ignore
    commands: ["api","arch","code","component","cook","coverage","debug","deploy","deploy-prod","deploy-staging","docs","docs-api","docs-arch","docs-changelog","docs-deploy","docs-onboard","docs-readme","e2e-test","fix","format","git","git-bisect","git-branch","git-cherry","git-merge","git-rebase","git-squash","git-stash","git-tag","integration-test","journal","kanban","lint","migrate","optimize","pr","refactor","review","schema","seed","ship","test","typecheck","unit-test","vibe-code","vibe-cook","watzup"],
    cascadesTo: ["ops"],
    entryPrompt: "Layer kỹ thuật. Cook, fix, test, review, hay deploy?",
    color: "green-400",
  },
  {
    id: "ops",
    chapter: "九變 — Nine Variations",
    role: "DevOps / Platform",
    description: "Audit, health, security, sync, environment. The foundation layer.",
    icon: "🔧",
    // prettier-ignore
    commands: ["audit","benchmark","bootstrap-auto","bootstrap-auto-fast","bootstrap-auto-parallel","clean","company-agent","company-billing","company-init","company-report","company-run","company-workflow","env","health","help","init","install","raas","raas-billing","raas-bootstrap","raas-bootstrap-auto","raas-bootstrap-auto-parallel","raas-bootstrap-parallel","raas-deploy","raas-mission","raas-status","report","rollback","security","setup-mcp","smoke","status","sync-agent","sync-all","sync-antigravity","sync-artifacts","sync-browser","sync-editor","sync-mcp","sync-rules","sync-tasks","update","use-mcp","win-check"],
    cascadesTo: [],
    entryPrompt: "Layer vận hành. Audit, health check, security, hay sync?",
    color: "orange-400",
  },
] as const
