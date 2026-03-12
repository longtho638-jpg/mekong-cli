import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold">My SaaS</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Get started
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Build your SaaS faster
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Next.js 15 + TypeScript + Tailwind CSS + better-auth
            <br />
            Everything you need to launch your SaaS product.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Start building free
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              View demo
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="border rounded-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Authentication</h3>
            <p className="text-gray-600">Email/password + OAuth (Google, GitHub) out of the box.</p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Database</h3>
            <p className="text-gray-600">PostgreSQL with Prisma ORM for type-safe queries.</p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">UI Components</h3>
            <p className="text-gray-600">Tailwind CSS + shadcn/ui ready for customization.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
