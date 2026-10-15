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

export interface Chapter {
  title: string
  paragraphs: string[]
}

/** Something to read: a pasted text, a downloaded article or a book. */
export interface TextRow {
  id: string
  kind: 'pasted' | 'article' | 'book'
  title: string
  author?: string
  source?: string
  url?: string
  addedAt: number
  wordCount: number
  chapters: Chapter[]
}

export interface ProgressRow {
  textId: string
  chapter: number
  /** Scroll position within the chapter, 0–1. */
  position: number
  /** Overall progress through the text, 0–1. */
  percent: number
  updatedAt: number
}

export class AppDB extends Dexie {
  settings!: EntityTable<SettingRow, 'key'>
  cards!: EntityTable<CardRow, 'word'>
  reviews!: EntityTable<ReviewRow, 'id'>
  texts!: EntityTable<TextRow, 'id'>
  progress!: EntityTable<ProgressRow, 'textId'>

  constructor() {
    super('english-teacher')
    this.version(1).stores({
      settings: 'key',
    })
    this.version(2).stores({
      cards: 'word, status, due, addedAt',
      reviews: '++id, word, at',
    })
    this.version(3).stores({
      texts: 'id, kind, addedAt',
      progress: 'textId, updatedAt',
    })
  }
}

export const db = new AppDB()
