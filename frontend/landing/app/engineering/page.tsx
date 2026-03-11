import LayerPageHero from '@/components/layer-page-hero'
import CommandGrid from '@/components/command-grid'
import SiteNav from '@/components/site-nav'
import { COMMANDS } from '@/data/commands'
import { LAYERS } from '@/data/layers'
import Link from 'next/link'

const engineeringLayer = LAYERS.find((l) => l.id === 'engineering')!
const engineeringCommands = COMMANDS.filter((c) => c.layer === 'engineering')

export default function EngineeringPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <SiteNav />
      <LayerPageHero
        icon={engineeringLayer.icon}
        title="Engineering Command Center"
        subtitle="47 commands + 4 super workflows. Ship code with AI agents."
        commandCount={engineeringCommands.length}
        color={engineeringLayer.color}
      />

      {/* Command groups */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Implementation', cmds: 'cook, code, fix, debug, vibe-code', color: 'border-cyan-500/30 bg-cyan-500/5' },
              { title: 'Testing', cmds: 'test, lint, coverage, e2e-test, unit-test', color: 'border-emerald-500/30 bg-emerald-500/5' },
              { title: 'Deployment', cmds: 'deploy, ship, deploy-staging, deploy-prod', color: 'border-blue-500/30 bg-blue-500/5' },
              { title: 'Documentation', cmds: 'docs, docs-api, docs-arch, docs-changelog, docs-readme', color: 'border-purple-500/30 bg-purple-500/5' },
              { title: 'Git', cmds: 'git, pr, git-merge, git-rebase, git-branch, git-stash, git-tag', color: 'border-amber-500/30 bg-amber-500/5' },
              { title: 'Architecture', cmds: 'arch, schema, migrate, refactor, optimize', color: 'border-indigo-500/30 bg-indigo-500/5' },
            ].map((group) => (
              <div key={group.title} className={`rounded-xl border p-4 ${group.color}`}>
                <h3 className="mb-2 text-sm font-bold text-white">{group.title}</h3>
                <p className="font-mono text-xs text-slate-400">{group.cmds}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal demo */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950">
            <div className="flex items-center gap-2 border-b border-slate-800/80 bg-slate-900/80 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs text-slate-500">engineering:ship</span>
            </div>
            <div className="p-5 font-mono text-sm leading-6">
              <div className="text-slate-400">$ mekong engineering:ship &quot;Add payment integration&quot;</div>
              <div className="text-slate-500">&nbsp;</div>
              <div className="text-slate-500">  Loading recipe: recipes/engineering/ship.json</div>
              <div className="text-yellow-400">  Group 1: /code &quot;payment module&quot;</div>
              <div className="text-yellow-400">  Group 2 (parallel): /test + /lint + /typecheck</div>
              <div className="text-yellow-400">  Group 3: /review</div>
              <div className="text-yellow-400">  Group 4: /deploy-staging</div>
              <div className="text-slate-500">&nbsp;</div>
              <div className="text-emerald-400">  Done: All checks passed. Deployed to staging.</div>
              <div className="text-purple-400">  Credits: -22 (balance: 178)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Commands grid */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-xl font-bold text-white">
            All Engineering Commands
          </h2>
          <CommandGrid commands={engineeringCommands} columns={3} />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 text-center">
        <Link
          href="/#quickstart"
          className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
        >
          Get started free
        </Link>
      </section>
    </main>
  )
}
