import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { db, type CardRow, type StoredFsrs } from './db'
import { LEVELS, type Word, type WordIndex } from './words'
import type { Settings } from './settings'

const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: true })

const DAY = 24 * 60 * 60 * 1000

/** The study day starts at 4 am, so late-night sessions count toward the same day. */
export function dayStart(now = Date.now()): number {
  const d = new Date(now - 4 * 60 * 60 * 1000)
  d.setHours(4, 0, 0, 0)
  return d.getTime()
}

function toStored(card: Card): StoredFsrs {
  return {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.getTime() : null,
  }
}

function fromStored(s: StoredFsrs): Card {
  return {
    ...s,
    due: new Date(s.due),
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  }
}

/** Memory stability in days (0 for words not yet reviewed). */
export function stabilityOf(row: CardRow | undefined): number {
  return row?.fsrs?.stability ?? 0
}

export async function markKnown(word: string, now = Date.now()) {
  await db.cards.put({ word, status: 'known', addedAt: now, due: 0, fsrs: null })
}

export async function startLearning(word: string, now = Date.now()) {
  const card = createEmptyCard(new Date(now))
  await db.cards.put({ word, status: 'learning', addedAt: now, due: now, fsrs: toStored(card) })
}

/** Removes all progress for a word so it becomes new again. */
export async function resetWord(word: string) {
  await db.transaction('rw', db.cards, db.reviews, async () => {
    await db.cards.delete(word)
    await db.reviews.where('word').equals(word).delete()
  })
}

/** Records an answer and schedules the next review. */
export async function answer(word: string, grade: Grade, exercise: string, now = Date.now()): Promise<CardRow> {
  return db.transaction('rw', db.cards, db.reviews, async () => {
    const row = await db.cards.get(word)
    const current = row?.fsrs ? fromStored(row.fsrs) : createEmptyCard(new Date(now))
    const { card } = scheduler.next(current, new Date(now), grade)
    const updated: CardRow = {
      word,
      status: 'learning',
      addedAt: row?.addedAt ?? now,
      due: card.due.getTime(),
      fsrs: toStored(card),
    }
    await db.cards.put(updated)
    await db.reviews.add({ word, at: now, rating: grade, exercise })
    return updated
  })
}

export async function dueCards(now = Date.now()): Promise<CardRow[]> {
  const rows = await db.cards.where('due').between(1, now, true, true).toArray()
  return rows.filter((r) => r.status === 'learning')
}

export async function nextDueTime(now = Date.now()): Promise<number | null> {
  const row = await db.cards.where('due').above(now).first()
  return row?.due ?? null
}

export async function learnedTodayCount(now = Date.now()): Promise<number> {
  return db.cards
    .where('addedAt')
    .aboveOrEqual(dayStart(now))
    .filter((r) => r.status === 'learning')
    .count()
}

// Stable pseudo-random order, so new words come in a fixed mixed order instead of A→Z.
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

export async function nextNewWords(index: WordIndex, settings: Settings, count: number, skip: string[] = []): Promise<Word[]> {
  const touched = new Set<string>([...((await db.cards.toCollection().primaryKeys()) as string[]), ...skip])
  const levels = settings.newWordOrder === 'hardest' ? [...LEVELS].reverse() : LEVELS
  const rank = (w: Word) => levels.indexOf(w.level)
  return index.list
    .filter((w) => !touched.has(w.word) && settings.newWordLevels.includes(w.level))
    .sort((a, b) => rank(a) - rank(b) || hash(a.word) - hash(b.word))
    .slice(0, count)
}

export function describeInterval(ms: number): string {
  if (ms < 60 * 60 * 1000) return `${Math.max(1, Math.round(ms / 60000))} min`
  if (ms < DAY) return `${Math.round(ms / 3600000)} h`
  const days = Math.round(ms / DAY)
  if (days < 31) return `${days} d`
  if (days < 365) return `${Math.round(days / 30)} mo`
  return `${(days / 365).toFixed(1)} y`
}
