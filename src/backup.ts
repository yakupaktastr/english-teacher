import { db } from './db'

const APP_ID = 'english-teacher'

interface BackupFile {
  app: typeof APP_ID
  schema: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

export async function createBackup(): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {}
  for (const table of db.tables) tables[table.name] = await table.toArray()
  return { app: APP_ID, schema: db.verno, exportedAt: new Date().toISOString(), tables }
}

/** Replaces all local data with the contents of a backup file. */
export async function restoreBackup(json: string): Promise<void> {
  let data: BackupFile
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (data?.app !== APP_ID || typeof data.tables !== 'object') {
    throw new Error('This file is not an English Teacher backup.')
  }
  if (data.schema > db.verno) {
    throw new Error('This backup was made by a newer version of the app. Update the app first.')
  }
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
      const rows = data.tables[table.name]
      if (Array.isArray(rows)) await table.bulkPut(rows)
    }
  })
}

/** Opens the iOS share sheet (Save to Files / iCloud) or falls back to a download. */
export async function shareBackup(): Promise<boolean> {
  const backup = await createBackup()
  const name = `english-backup-${backup.exportedAt.slice(0, 10)}.json`
  const file = new File([JSON.stringify(backup)], name, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false
      throw err
    }
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
