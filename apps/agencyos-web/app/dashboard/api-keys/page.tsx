import { Key, Plus } from 'lucide-react'
import { fetchApiKeysForCurrentUser } from '@/lib/fetch-api-keys-from-supabase-user-metadata'
import type { KeyStatus } from '@/lib/fetch-api-keys-from-supabase-user-metadata'

const STATUS_STYLES: Record<KeyStatus, string> = {
  active:  'bg-green-500/20 text-green-400 border border-green-500/30',
  revoked: 'bg-zinc-700/60 text-zinc-500 border border-zinc-600/40',
}

export default async function ApiKeysPage() {
  const keys = await fetchApiKeysForCurrentUser()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your RaaS API credentials.</p>
        </div>
        {/* New Key is a no-op until key creation backend is wired */}
        <button
          type="button"
          disabled
          aria-label="Create new API key (coming soon)"
          title="Key creation coming soon"
          className="flex items-center gap-2 rounded-lg bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Key
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <p className="text-xs text-zinc-500">
            Keep your keys secret. Rotate them regularly.
            Never expose keys in client-side code or public repositories.
          </p>
        </div>

        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-5 gap-3" role="status">
            <Key className="h-8 w-8 text-zinc-700" aria-hidden="true" />
            <p className="text-sm text-zinc-500">No API keys found.</p>
            <p className="text-xs text-zinc-600">Keys will appear here once your account is provisioned.</p>
          </div>
        ) : (
          <table className="w-full text-sm" role="table" aria-label="API keys table">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wide">
                <th scope="col" className="px-5 py-3 font-medium">Name</th>
                <th scope="col" className="px-5 py-3 font-medium hidden sm:table-cell">Key</th>
                <th scope="col" className="px-5 py-3 font-medium hidden md:table-cell">Created</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-zinc-600 shrink-0" aria-hidden="true" />
                      <span className="text-zinc-200 font-medium">{k.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <code className="font-mono text-xs text-zinc-500">{k.maskedKey}</code>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 hidden md:table-cell">{k.createdAt}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[k.status]}`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {k.status === 'active' && (
                      <button
                        type="button"
                        disabled
                        aria-label={`Revoke key ${k.name} (coming soon)`}
                        title="Revoke coming soon"
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-600 disabled:cursor-not-allowed"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
