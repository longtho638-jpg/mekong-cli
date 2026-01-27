import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js User Preferences Kit | Theme Switching & Settings",
  description:
    "Production-ready user preferences system for Next.js. Dark mode, notification settings, privacy controls. Drop-in components with Supabase sync. Ship in 10 minutes.",
  keywords: [
    "nextjs starter kit",
    "user preferences",
    "dark mode react",
    "theme switching nextjs",
    "supabase settings",
  ],
  openGraph: {
    title: "User Preferences Kit - Ship Settings in 10 Minutes",
    description:
      "Drop-in user preferences for Next.js with theme switching, notifications, and privacy controls.",
    type: "website",
    url: "https://agencyos.network/products/user-preferences-kit",
    images: [
      {
        url: "/products/user-preferences-kit-og.png",
        width: 1200,
        height: 630,
        alt: "User Preferences Kit for Next.js",
      },
    ],
  },
};

export default function UserPreferencesKitPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            Developer Kit
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            User Preferences Kit for Next.js
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Production-ready settings system. Theme switching, notifications,
            privacy controls.
            <br />
            <strong>Ship in 10 minutes.</strong>
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="https://antigravity.gumroad.com/l/user-preferences-kit"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Get the Kit - $47
            </a>
            <a
              href="#demo"
              className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              See Demo
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What's Included
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              emoji="🌓"
              title="Theme Switching"
              description="Dark, light, and system modes. Smooth transitions with no flash on load."
            />
            <FeatureCard
              emoji="🔔"
              title="Notification Settings"
              description="Email, push, and in-app toggles. Granular controls for different notification types."
            />
            <FeatureCard
              emoji="🔒"
              title="Privacy Controls"
              description="GDPR-ready consent management. Data export and deletion requests."
            />
            <FeatureCard
              emoji="💾"
              title="Auto Database Sync"
              description="Real-time persistence with Supabase. Works offline with local fallback."
            />
            <FeatureCard
              emoji="🎨"
              title="Beautiful UI"
              description="Tailwind CSS + shadcn/ui components. Customize to match your brand."
            />
            <FeatureCard
              emoji="📦"
              title="TypeScript Ready"
              description="Full type definitions. IntelliSense for all props and hooks."
            />
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Built With</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Next.js 14",
              "React 19",
              "TypeScript",
              "Supabase",
              "Tailwind CSS",
              "shadcn/ui",
            ].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Schema */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-6">
            <FAQItem
              question="What's included in the kit?"
              answer="TypeScript components for theme toggle, notification settings, and privacy controls. Plus hooks, utilities, and Supabase migration scripts."
            />
            <FAQItem
              question="Does it work with my existing project?"
              answer="Yes! The components are designed to drop into any Next.js 13+ project. Just copy, configure your Supabase keys, and import."
            />
            <FAQItem
              question="Is there a refund policy?"
              answer="30-day money-back guarantee. If it doesn't work for you, email us for a full refund."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20 px-4 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Ship Faster?</h2>
          <p className="text-lg opacity-90 mb-8">
            Stop building settings from scratch. Get production-ready code
            today.
          </p>
          <a
            href="https://antigravity.gumroad.com/l/user-preferences-kit"
            className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Get User Preferences Kit - $47
          </a>
        </div>
      </section>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "User Preferences Kit",
            description:
              "Production-ready user preferences system for Next.js with theme switching, notifications, and privacy controls.",
            brand: {
              "@type": "Brand",
              name: "Antigravity",
            },
            offers: {
              "@type": "Offer",
              price: "47",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />
    </main>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="p-6 bg-white rounded-xl border border-gray-200">
      <summary className="font-semibold cursor-pointer">{question}</summary>
      <p className="mt-4 text-gray-600">{answer}</p>
    </details>
  );
}
