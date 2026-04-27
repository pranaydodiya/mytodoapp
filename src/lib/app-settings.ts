import { z } from 'zod'
import type { Priority } from '@/types/todo'

const priorityValues = z.enum(['low', 'medium', 'high'] as [Priority, Priority, Priority])

export const appSettingsSchema = z.object({
  /** When true, new sessions load the checklist panel in an expanded state per task until toggled. */
  subtasksStartExpanded: z.boolean().default(true),
  /** Tighter row spacing in the subtask list. */
  subtasksCompact: z.boolean().default(false),
  /** Play a soft keyboard chime in dev only (no-op in production). */
  keyboardAudioFeedback: z.boolean().default(false),
  /** Priority pre-selected on the "new task" form. */
  defaultNewTaskPriority: priorityValues.default('medium'),
  /** Show a persistent bar at the top with shortcut reminders (when shortcuts enabled). */
  showShortcutChips: z.boolean().default(true),
  /** When false, the home page will not install global key handlers. */
  keyboardShortcutsEnabled: z.boolean().default(true),
  /** Time strings from a time input (UI-only quiet hours). */
  focusQuietStart: z.string().max(8).optional(),
  focusQuietEnd: z.string().max(8).optional(),
  /** Explanatory copy density on the help link targets. */
  helpDensity: z.enum(['concise', 'normal']).default('normal'),
  /** If set, the export filename uses this as a prefix. */
  exportFilePrefix: z.string().max(64).default('todos'),
  /** When true, the `?` key opens the shortcuts dialog (outside text fields). */
  openHelpWithQuestionMark: z.boolean().default(true),
})

export type AppSettings = z.infer<typeof appSettingsSchema>

const STORAGE_KEY = 'todoapp.settings.v2'

const defaults: AppSettings = appSettingsSchema.parse({})

export { defaults as defaultAppSettings }

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return defaults
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) {
      return defaults
    }
    const json: unknown = JSON.parse(raw)
    return appSettingsSchema.parse(json)
  } catch {
    return defaults
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') {
    return
  }
  const parsed = appSettingsSchema.parse(settings)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
}

export function settingsStorageKeyForTests(): string {
  return STORAGE_KEY
}
