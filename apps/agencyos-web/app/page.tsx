import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-purple-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-900/20 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="z-10 container mx-auto flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <span className="text-white">A</span>
          </div>
          AgencyOS
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="#" className="hover:text-white transition-colors">Features</Link>
          <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-white transition-colors">Developers</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Login</Link>
          <Button variant="secondary" className="rounded-full px-6 bg-white text-black hover:bg-zinc-200">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs font-medium text-purple-400 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="h-3 w-3" />
          <span>Results-as-a-Service Engine v2.0</span>
        </div>

        <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Don't buy tools. <br />
          <span className="text-white">Buy Deliverables.</span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          The world's first RaaS platform. You pay for results—CEO leads, SEO articles, and competitor reports—executed by autonomous AI agents.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <Button size="lg" className="rounded-full px-8 h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 shadow-lg shadow-purple-500/20">
            Start RaaS Engine <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-zinc-800 bg-black/50 hover:bg-zinc-900 text-zinc-300">
            View Documentation
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl w-full px-4 text-left">
          <FeatureCard 
            icon={<Zap className="h-6 w-6 text-yellow-400" />}
            title="Instant Results"
            desc="No more waiting for freelancers. Agents work 24/7/365 at lightspeed."
          />
          <FeatureCard 
            icon={<Shield className="h-6 w-6 text-green-400" />}
            title="Enterprise Logic"
            desc="Built on Mekong CLI and OpenClaw. Industrial-grade execution pipelines."
          />
          <FeatureCard 
            icon={<Globe className="h-6 w-6 text-blue-400" />}
            title="Viral Ecosystem"
            desc="Open source developer kit (Zone B) powers the RaaS engine (Zone C)."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 border-t border-zinc-900 py-12 text-center text-sm text-zinc-600">
        <p>© 2026 AgencyOS Network. Powered by Tôm Hùm AGI.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-sm transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}
