'use client'

import { useAppSettings } from '@/hooks/useAppSettings'
import { SettingsForm } from '@/components/SettingsForm'

export default function SettingsPage() {
  const { settings, update, reset, ready } = useAppSettings()

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
        <div className="mx-auto max-w-2xl text-sm text-zinc-500">Loading settings…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <article className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Local preferences and accessibility options. Nothing here leaves your browser except when you
            use the app normally (APIs and exports).
          </p>
        </header>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SettingsForm value={settings} onChange={update} onReset={reset} />
        </div>
      </article>
    </div>
  )
}
