'use client'

import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { label: 'Founder', href: '/founder' },
  { label: 'Business', href: '/business' },
  { label: 'Product', href: '/product' },
  { label: 'Engineering', href: '/engineering' },
  { label: 'Ops', href: '/ops' },
  { label: 'Pricing', href: '/pricing' },
]

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 px-4 py-3 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--md-surface)]/90 backdrop-blur-xl border-b border-[var(--md-outline-variant)]'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--md-on-surface)] transition-opacity hover:opacity-80"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-black text-white shadow-lg shadow-cyan-500/20">
            M
          </span>
          <span className="text-[var(--md-primary)]">Mekong</span>
          <span>CLI</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="https://github.com/longtho638-jpg/mekong-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--md-on-surface-variant)] transition-colors hover:text-[var(--md-on-surface)]"
            aria-label="GitHub"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Star
          </a>
          <a
            href="#quickstart"
            className="rounded-lg bg-[var(--md-primary)] px-4 py-2 text-sm font-semibold text-[var(--md-on-primary)] shadow-lg transition-all hover:opacity-90"
          >
            Get started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex items-center rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2.5 text-sm text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 border-t border-[var(--md-outline-variant)] pt-2">
              <a
                href="#quickstart"
                className="block rounded-lg bg-[var(--md-primary)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--md-on-primary)]"
                onClick={() => setMobileOpen(false)}
              >
                Get started free
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
