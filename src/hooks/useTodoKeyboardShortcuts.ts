'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { AppSettings } from '@/lib/app-settings'

export type KeyboardShortcutHandlers = {
  onFocusNewTask?: () => void
  onFocusSearch?: () => void
  onOpenHelp?: () => void
  onEscapeOverlay?: () => void
}

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) {
    return false
  }
  if (t.isContentEditable) {
    return true
  }
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true
  }
  if (t.closest('[data-no-todo-shortcuts="true"]')) {
    return true
  }
  return false
}

type Options = {
  enabled: boolean
  settings: AppSettings
  openHelp: () => void
} & KeyboardShortcutHandlers

/**
 * Binds a small set of productivity shortcuts on the home page. Respects input focus
 * and can be fully disabled from settings.
 */
export function useTodoKeyboardShortcuts({
  enabled,
  settings,
  openHelp,
  onFocusNewTask,
  onFocusSearch,
  onOpenHelp,
  onEscapeOverlay,
}: Options) {
  const helpRef = useRef(openHelp)
  helpRef.current = openHelp

  const handle = useCallback(
    (e: KeyboardEvent) => {
      if (!settings.keyboardShortcutsEnabled) {
        return
      }
      if (!enabled) {
        return
      }
      if (e.defaultPrevented) {
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return
      }
      if (e.key === 'Escape') {
        onEscapeOverlay?.()
        return
      }
      if (isEditableTarget(e.target)) {
        if (e.key === '?' && settings.openHelpWithQuestionMark) {
          const el = e.target
          if (el instanceof HTMLInputElement && el.type === 'search') {
            return
          }
        }
        return
      }
      if (e.key === 'n' || e.key === 'N') {
        if (onFocusNewTask) {
          e.preventDefault()
          onFocusNewTask()
        }
        return
      }
      if (e.key === '/') {
        if (onFocusSearch) {
          e.preventDefault()
          onFocusSearch()
        }
        return
      }
      if (e.key === '?' && settings.openHelpWithQuestionMark) {
        e.preventDefault()
        ;(onOpenHelp ?? (() => helpRef.current()))()
        return
      }
    },
    [enabled, onEscapeOverlay, onFocusNewTask, onFocusSearch, onOpenHelp, settings],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }
    window.addEventListener('keydown', handle, { capture: true })
    return () => window.removeEventListener('keydown', handle, { capture: true })
  }, [handle, enabled])
}
