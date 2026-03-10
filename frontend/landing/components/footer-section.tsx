const LINKS = [
  { label: 'GitHub', href: 'https://github.com/agencyos/mekong-cli' },
  { label: 'Docs', href: 'https://docs.agencyos.network' },
  { label: 'Discord', href: 'https://discord.gg/agencyos' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
]

export default function FooterSection() {
  return (
    <footer className="border-t border-slate-900 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div>
            <div className="mb-1 text-lg font-bold text-white">
              <span className="text-cyan-400">Agency</span>OS
            </div>
            <p className="text-xs text-slate-600">AGI Vibe Coding Factory</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-900 pt-8 text-center text-xs text-slate-700">
          <p>© 2026 Binh Pháp Venture Studio. All rights reserved.</p>
          <p className="mt-1 font-mono">
            孫子兵法 · Plan → Execute → Verify · Built with Mekong CLI
          </p>
        </div>
      </div>
    </footer>
  )
}
