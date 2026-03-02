import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function updateDisplayName(formData: FormData) {
  'use server'
  const displayName = (formData.get('displayName') as string | null)?.trim() ?? ''
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  })
  if (error) {
    // Re-render with error — simplest approach without client state
    redirect('/dashboard/settings?error=1')
  }
  revalidatePath('/dashboard/settings')
  redirect('/dashboard/settings?saved=1')
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const saved = params.saved === '1'
  const hasError = params.error === '1'

  const email = user.email ?? ''
  const displayName = (user.user_metadata?.display_name as string | undefined) ?? ''

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
        >
          Changes saved successfully.
        </div>
      )}

      {hasError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          Failed to save changes. Please try again.
        </div>
      )}

      {/* Account section */}
      <section
        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        aria-labelledby="account-section-heading"
      >
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 id="account-section-heading" className="text-sm font-medium text-zinc-200">
            Account
          </h2>
        </div>
        <form action={updateDisplayName} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="settings-email"
              className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5"
            >
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={email}
              readOnly
              aria-readonly="true"
              aria-describedby="settings-email-hint"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 cursor-not-allowed focus:outline-none"
            />
            <p id="settings-email-hint" className="mt-1 text-xs text-zinc-600">
              Email cannot be changed here.
            </p>
          </div>

          <div>
            <label
              htmlFor="settings-display-name"
              className="block text-xs text-zinc-500 uppercase tracking-wide mb-1.5"
            >
              Display Name
            </label>
            <input
              id="settings-display-name"
              name="displayName"
              type="text"
              defaultValue={displayName}
              placeholder="Enter display name"
              maxLength={80}
              aria-label="Display name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-600 transition-colors"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
