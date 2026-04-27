'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  type AppSettings,
  appSettingsSchema,
  defaultAppSettings,
  loadAppSettings,
  saveAppSettings,
} from '@/lib/app-settings'

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSettings(loadAppSettings())
    setReady(true)
  }, [])

  const update = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = appSettingsSchema.parse({ ...prev, ...partial })
      saveAppSettings(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    const d = appSettingsSchema.parse({})
    setSettings(d)
    saveAppSettings(d)
  }, [])

  return { settings, update, reset, ready }
}
