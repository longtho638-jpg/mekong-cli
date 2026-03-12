"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Account Status</h2>
            <p className="text-green-600 font-medium">Active</p>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Subscription</h2>
            <p className="text-gray-600">Free Tier</p>
            <button className="mt-3 text-sm text-blue-600 hover:underline">
              Upgrade to Pro
            </button>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">API Usage</h2>
            <p className="text-gray-600">0 / 1000 requests</p>
          </div>
        </div>

        <div className="mt-8 border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Account created
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              Set up organization
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              Configure API keys
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              Make first API call
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
