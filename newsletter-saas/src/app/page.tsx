import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Viral Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-center py-3 px-6 text-sm font-medium">
        🎉 <strong>New Year Launch!</strong> First 100 users get Pro FREE for 3 months →
        <span className="ml-2 font-bold">87 spots left</span>
      </div>

      {/* Navigation */}
      <nav className="fixed top-10 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold gradient-text">
            📧 Mekong Mail
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-indigo-400 transition-colors">Login</Link>
            <Link href="/signup?plan=pro" className="btn-primary">Claim Free Pro →</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Social Proof Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <div className="flex -space-x-2">
              {['🧑‍💼', '👩‍💻', '🧑‍🎨', '👨‍💼'].map((emoji, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm border-2 border-[#0a0a0a]">
                  {emoji}
                </div>
              ))}
            </div>
            <span className="text-green-400 text-sm font-medium">127 agencies joined this week</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Manage <span className="gradient-text">All Client Newsletters</span>
            <br />in One Dashboard
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Stop logging into 20 different accounts. Mekong Mail lets you manage
            unlimited client newsletters with AI-powered writing and guild cross-promotion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?plan=pro" className="btn-primary text-lg animate-pulse-glow">
              🎁 Claim Free Pro (87 left) →
            </Link>
            <Link href="#demo" className="btn-secondary text-lg">
              Watch Demo (2 min)
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-8 mt-10 text-gray-500 text-sm">
            <span>✅ No credit card required</span>
            <span>✅ Setup in 2 minutes</span>
            <span>✅ Cancel anytime</span>
            <span>⭐ 4.9/5 rating</span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-6xl mx-auto mt-16 gradient-border p-1 rounded-2xl">
          <div className="bg-[#1e1e2e] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-500 text-sm ml-4">dashboard.mekongmail.com</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Tech Weekly", client: "TechCo", subs: "1,247", rate: "52%" },
                { name: "Design Digest", client: "DesignHub", subs: "856", rate: "48%" },
                { name: "AI Insights", client: "AI Corp", subs: "2,100", rate: "61%" },
              ].map((nl, i) => (
                <div key={i} className="bg-[#12121a] rounded-lg p-4 card-hover cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{nl.name}</h3>
                    <span className="text-xs text-green-400">● Live</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">Client: {nl.client}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">👥 {nl.subs}</span>
                    <span className="text-indigo-400">📊 {nl.rate} open</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-gray-400 mb-10">Trusted by agencies worldwide</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah Chen", role: "Founder, PixelAgency", text: "Reduced our newsletter management time by 80%. Game changer for agencies.", avatar: "👩‍💼" },
              { name: "Mike Johnson", role: "CEO, GrowthLabs", text: "The AI writing feature alone is worth 10x the price. Phenomenal product.", avatar: "👨‍💻" },
              { name: "Lisa Park", role: "Director, CreativeStudio", text: "Finally, one dashboard for all 12 client newsletters. Sanity restored.", avatar: "👩‍🎨" },
            ].map((t, i) => (
              <div key={i} className="glass rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl">{t.avatar}</div>
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-gray-500 text-sm">{t.role}</div>
                  </div>
                </div>
                <p className="text-gray-300">&quot;{t.text}&quot;</p>
                <div className="mt-3 text-yellow-400">★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#0d0d12]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Everything Agencies Need
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Built specifically for agencies managing multiple client newsletters
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🏢", title: "Multi-Brand Dashboard", desc: "One login to manage all client newsletters. Switch between brands instantly." },
              { icon: "🤖", title: "AI Writing Assistant", desc: "Generate full newsletter drafts from a topic. Edit, refine, and send in minutes." },
              { icon: "🔗", title: "Guild Cross-Promo", desc: "Grow your clients' lists by recommending each other. Network effect built-in." },
              { icon: "📊", title: "Real-time Analytics", desc: "Track opens, clicks, and growth across all newsletters in one view." },
              { icon: "📅", title: "Smart Scheduling", desc: "Schedule sends for optimal times. Timezone-aware for global audiences." },
              { icon: "🎨", title: "Beautiful Templates", desc: "Start with proven templates or build your own. Full customization." },
            ].map((feature, i) => (
              <div key={i} className="glass rounded-xl p-6 card-hover">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 mb-6">
            <span className="text-pink-400 text-sm font-medium">🎁 Referral Program</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Give 3 Months Free, Get 3 Months Free
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Share Mekong Mail with fellow agency founders. When they sign up,
            you both get 3 months of Pro for free. No limits.
          </p>
          <div className="glass rounded-2xl p-8 max-w-xl mx-auto">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value="mekongmail.com/ref/your-code"
                readOnly
                className="flex-1 px-4 py-3 bg-[#12121a] rounded-lg text-gray-400"
              />
              <button className="btn-primary">Copy Link</button>
            </div>
            <div className="flex justify-center gap-4">
              <button className="p-3 rounded-lg bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 transition-colors">
                <span className="text-xl">𝕏</span>
              </button>
              <button className="p-3 rounded-lg bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 transition-colors">
                <span className="text-xl">💼</span>
              </button>
              <button className="p-3 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-colors">
                <span className="text-xl">💬</span>
              </button>
              <button className="p-3 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 transition-colors">
                <span className="text-xl">📧</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-[#0d0d12]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
              <span className="text-green-400 text-sm font-medium">🎉 New Year Special: First 100 get Pro FREE for 3 months</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">Start free. Scale as you grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="glass rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-1">$0</div>
              <p className="text-gray-500 mb-6">Forever free</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 1 newsletter</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 500 subscribers</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 1,000 sends/month</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Basic analytics</li>
              </ul>
              <Link href="/signup?plan=free" className="btn-secondary w-full block text-center">Get Started</Link>
            </div>

            {/* Pro - Popular */}
            <div className="gradient-border p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 rounded-full text-sm font-semibold">
                🔥 87 spots left
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-1">
                <span className="line-through text-gray-500 text-2xl mr-2">$29</span>
                FREE
              </div>
              <p className="text-green-400 mb-6">For 3 months → then $29/mo</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 5 newsletters</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 10,000 subscribers</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 50,000 sends/month</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> <strong>AI writing assistant</strong></li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Custom domain</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Automations</li>
              </ul>
              <Link href="/signup?plan=pro" className="btn-primary w-full block text-center animate-pulse-glow">
                Claim Free Pro →
              </Link>
            </div>

            {/* Agency */}
            <div className="glass rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Agency</h3>
              <div className="text-4xl font-bold mb-1">$99<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-gray-500 mb-6">+ $10/newsletter</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited newsletters</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited subscribers</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited sends</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> White-label option</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> API access</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Priority support</li>
              </ul>
              <Link href="/signup?plan=agency" className="btn-secondary w-full block text-center">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            2025 is Your Year to Scale
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 500+ agencies who simplified their newsletter workflow.
            <br />Claim your free Pro account before spots run out.
          </p>
          <Link href="/signup?plan=pro" className="btn-primary text-lg inline-block animate-pulse-glow">
            🎁 Claim Free Pro (87 spots left) →
          </Link>
          <p className="text-gray-500 text-sm mt-4">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold gradient-text">📧 Mekong Mail</div>
          <div className="flex gap-8 text-gray-400">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            <Link href="#" className="hover:text-white transition-colors">Blog</Link>
          </div>
          <p className="text-gray-500">© 2025 Mekong Mail. Built with 💜 in Vietnam.</p>
        </div>
      </footer>
    </div>
  );
}
