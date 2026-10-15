import Dexie, { type EntityTable } from 'dexie'

// Key-value rows; the app settings live under key 'app'.
export interface SettingRow {
  key: string
  value: unknown
}

export class AppDB extends Dexie {
  settings!: EntityTable<SettingRow, 'key'>

  constructor() {
    super('english-teacher')
    // New tables are added in later phases with db.version(2), version(3)...
    this.version(1).stores({
      settings: 'key',
    })
  }
}

export const db = new AppDB()
