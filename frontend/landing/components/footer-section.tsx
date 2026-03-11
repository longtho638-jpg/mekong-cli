const LAYER_LINKS = [
  { label: '👑 Founder', href: '/founder' },
  { label: '🏢 Business', href: '/business' },
  { label: '📦 Product', href: '/product' },
  { label: '⚙️ Engineering', href: '/engineering' },
  { label: '🔧 Ops', href: '/ops' },
  { label: '💰 Pricing', href: '/pricing' },
]

const EXTERNAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/longtho638-jpg/mekong-cli' },
  { label: 'Discord', href: 'https://discord.gg/agencyos' },
  { label: 'Quickstart', href: '/dev/quickstart' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
]

export default function FooterSection() {
  return (
    <footer className="relative border-t border-slate-800/60 px-6 py-16">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

      <div className="mx-auto max-w-5xl">
        <div className="mb-10 grid gap-10 sm:grid-cols-3">

          {/* Brand */}
          <div>
            <a href="/" className="mb-3 inline-flex items-center gap-2 text-lg font-bold text-white transition-opacity hover:opacity-80">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-black text-white shadow-lg shadow-cyan-500/20">
                M
              </span>
              <span className="text-cyan-400">Mekong</span> CLI
            </a>
            <p className="mb-4 text-xs text-slate-500">
              AI-Operated Business Platform.<br />
              319 commands. 89 super workflows. Open source.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/longtho638-jpg/mekong-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300"
                aria-label="GitHub"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/agencyos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300"
                aria-label="Discord"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.08.114 18.1.138 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Layers */}
          <nav>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Layers
            </p>
            <div className="flex flex-col gap-2">
              {LAYER_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Links */}
          <nav>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resources
            </p>
            <div className="flex flex-col gap-2">
              {EXTERNAL_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/60 pt-8 text-center">
          <p className="text-xs text-slate-600">
            &copy; 2026 Binh Phap Venture Studio. All rights reserved.
          </p>
          <p className="mt-1 font-mono text-xs text-slate-700">
            Plan &rarr; Execute &rarr; Verify &nbsp;&middot;&nbsp; Built with Mekong CLI
          </p>
        </div>
      </div>
    </footer>
  )
}
