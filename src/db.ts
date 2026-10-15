import Dexie, { type EntityTable } from 'dexie'

// Key-value rows; the app settings live under key 'app'.
export interface SettingRow {
  key: string
  value: unknown
}

/** FSRS card state with dates stored as epoch milliseconds (JSON-safe for backups). */
export interface StoredFsrs {
  due: number
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review: number | null
}

/** A word the learner has touched. Words without a row are still "new". */
export interface CardRow {
  word: string
  status: 'learning' | 'known'
  addedAt: number
  /** Next review time; 0 for known words. */
  due: number
  fsrs: StoredFsrs | null
}

export interface ReviewRow {
  id?: number
  word: string
  at: number
  rating: number
  exercise: string
}

export class AppDB extends Dexie {
  settings!: EntityTable<SettingRow, 'key'>
  cards!: EntityTable<CardRow, 'word'>
  reviews!: EntityTable<ReviewRow, 'id'>

  constructor() {
    super('english-teacher')
    this.version(1).stores({
      settings: 'key',
    })
    this.version(2).stores({
      cards: 'word, status, due, addedAt',
      reviews: '++id, word, at',
    })
  }
}

export const db = new AppDB()
