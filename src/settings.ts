import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

export type Theme = 'system' | 'light' | 'sepia' | 'dark'
export type ReaderFont = 'serif' | 'sans'
export type LineSpacing = 'compact' | 'normal' | 'relaxed'

export interface Settings {
  theme: Theme
  readerFont: ReaderFont
  fontSize: number // px
  lineSpacing: LineSpacing
  dailyNewWords: number
  lastBackupAt: string | null
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  readerFont: 'serif',
  fontSize: 19,
  lineSpacing: 'normal',
  dailyNewWords: 10,
  lastBackupAt: null,
}

export const LINE_HEIGHTS: Record<LineSpacing, number> = {
  compact: 1.45,
  normal: 1.65,
  relaxed: 1.9,
}

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('app')
  return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<Settings> | undefined) }
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const current = await getSettings()
    await db.settings.put({ key: 'app', value: { ...current, ...patch } })
  })
}

export function useSettings(): Settings {
  return useLiveQuery(getSettings, [], DEFAULT_SETTINGS)
}
