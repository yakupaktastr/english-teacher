import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { createBackup, restoreBackup } from './backup'
import { getSettings, updateSettings } from './settings'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('backup', () => {
  it('restores exactly what was exported', async () => {
    await updateSettings({ theme: 'sepia', fontSize: 22 })
    const json = JSON.stringify(await createBackup())

    await updateSettings({ theme: 'dark', fontSize: 15 })
    await restoreBackup(json)

    const settings = await getSettings()
    expect(settings.theme).toBe('sepia')
    expect(settings.fontSize).toBe(22)
  })

  it('rejects files that are not backups', async () => {
    await expect(restoreBackup('{"hello":1}')).rejects.toThrow('not an English Teacher backup')
    await expect(restoreBackup('not json')).rejects.toThrow('not valid JSON')
  })

  it('leaves data untouched when the file is rejected', async () => {
    await updateSettings({ theme: 'sepia' })
    await restoreBackup('{}').catch(() => {})
    expect((await getSettings()).theme).toBe('sepia')
  })
})
