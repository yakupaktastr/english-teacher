import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { db } from './db'
import { answer, dayStart, dueCards, learnedTodayCount, markKnown, nextNewWords, resetWord, startLearning } from './srs'
import { DEFAULT_SETTINGS } from './settings'
import type { Word, WordIndex } from './words'

const DAY = 24 * 60 * 60 * 1000

function word(w: string, level: Word['level']): Word {
  return { word: w, level, ipa: '', senses: [], collocations: [], synonyms: [], family: [] }
}
const list = [word('alpha', 'a1'), word('beta', 'b2'), word('gamma', 'c1'), word('delta', 'c1')]
const index: WordIndex = { list, byWord: new Map(list.map((w) => [w.word, w])) }

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('srs', () => {
  it('schedules longer intervals after successful reviews', async () => {
    const t0 = Date.UTC(2026, 0, 1, 12)
    await startLearning('alpha', t0)
    let row = await answer('alpha', Rating.Good, 'meaning', t0)
    let t = t0
    const intervals: number[] = []
    for (let i = 0; i < 4; i++) {
      t = row.due
      row = await answer('alpha', Rating.Good, 'clozeType', t)
      intervals.push(row.due - t)
    }
    expect(intervals[3]).toBeGreaterThan(intervals[0])
    expect(intervals[3]).toBeGreaterThan(5 * DAY)
  })

  it('brings a forgotten word back soon', async () => {
    const t0 = Date.UTC(2026, 0, 1, 12)
    await startLearning('alpha', t0)
    const row = await answer('alpha', Rating.Again, 'meaning', t0)
    expect(row.due - t0).toBeLessThan(15 * 60 * 1000)
  })

  it('lists due cards but never known words', async () => {
    const now = Date.now()
    await startLearning('alpha', now - 1000)
    await markKnown('beta', now - 1000)
    expect((await dueCards(now)).map((r) => r.word)).toEqual(['alpha'])
  })

  it('offers untouched words, hardest level first, within the chosen levels', async () => {
    await markKnown('gamma')
    const next = await nextNewWords(index, DEFAULT_SETTINGS, 10)
    expect(next.map((w) => w.word)).toEqual(['delta', 'beta', 'alpha'])

    const onlyA1 = await nextNewWords(index, { ...DEFAULT_SETTINGS, newWordLevels: ['a1'] }, 10)
    expect(onlyA1.map((w) => w.word)).toEqual(['alpha'])
  })

  it('counts words started today and forgets reset words', async () => {
    const now = Date.now()
    await startLearning('alpha', now)
    await startLearning('beta', dayStart(now) - 1000)
    await markKnown('gamma', now)
    expect(await learnedTodayCount(now)).toBe(1)

    await answer('alpha', Rating.Good, 'meaning', now)
    await resetWord('alpha')
    expect(await db.cards.get('alpha')).toBeUndefined()
    expect(await db.reviews.where('word').equals('alpha').count()).toBe(0)
  })
})
