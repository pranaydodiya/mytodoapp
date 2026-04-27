'use client'

import type { AppSettings } from '@/lib/app-settings'
import type { Priority } from '@/types/todo'

type Props = {
  value: AppSettings
  onChange: (next: Partial<AppSettings>) => void
  onReset: () => void
}

export function SettingsForm({ value, onChange, onReset }: Props) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Checklists
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Control how subtasks appear under each task. These are stored only in this browser.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.subtasksStartExpanded}
            onChange={e => onChange({ subtasksStartExpanded: e.target.checked })}
          />
          Remember expanded checklist panels (per-tab session)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.subtasksCompact}
            onChange={e => onChange({ subtasksCompact: e.target.checked })}
          />
          Compact subtask row spacing
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Shortcuts</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Global key bindings on the home page, when focus is not in a form field.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.keyboardShortcutsEnabled}
            onChange={e => onChange({ keyboardShortcutsEnabled: e.target.checked })}
          />
          Enable keyboard shortcuts
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.openHelpWithQuestionMark}
            onChange={e => onChange({ openHelpWithQuestionMark: e.target.checked })}
          />
          <kbd className="rounded border border-zinc-200 px-1 font-mono text-xs dark:border-zinc-600">?</kbd>{' '}
          opens the shortcut dialog
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.showShortcutChips}
            onChange={e => onChange({ showShortcutChips: e.target.checked })}
          />
          Show home-page shortcut tip bar
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.keyboardAudioFeedback}
            onChange={e => onChange({ keyboardAudioFeedback: e.target.checked })}
          />
          Keyboard audio (experimental, mostly silent)
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">New tasks</h2>
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Default priority</span>
          <select
            className="mt-1 block w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={value.defaultNewTaskPriority}
            onChange={e => onChange({ defaultNewTaskPriority: e.target.value as Priority })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Export file prefix</span>
          <input
            type="text"
            value={value.exportFilePrefix}
            onChange={e => onChange({ exportFilePrefix: e.target.value })}
            className="mt-1 block w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            maxLength={64}
            placeholder="todos"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Focus &amp; help</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Quiet start (24h, UI only)</span>
            <input
              type="time"
              value={value.focusQuietStart ?? ''}
              onChange={e =>
                onChange({ focusQuietStart: e.target.value || undefined })
              }
              className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Quiet end</span>
            <input
              type="time"
              value={value.focusQuietEnd ?? ''}
              onChange={e => onChange({ focusQuietEnd: e.target.value || undefined })}
              className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Help copy density</span>
          <select
            className="mt-1 block w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={value.helpDensity}
            onChange={e =>
              onChange({ helpDensity: e.target.value as 'concise' | 'normal' })
            }
          >
            <option value="normal">Normal</option>
            <option value="concise">Concise</option>
          </select>
        </label>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
        >
          Reset all to defaults
        </button>
      </div>
    </div>
  )
}
