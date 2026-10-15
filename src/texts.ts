import { db, type Chapter, type TextRow } from './db'

export function countWords(chapters: Chapter[]): number {
  let n = 0
  for (const c of chapters) for (const p of c.paragraphs) n += p.split(/\s+/).filter(Boolean).length
  return n
}

/**
 * Splits pasted text into paragraphs. Blank lines separate paragraphs; when the text has none,
 * every line break does. Lines wrapped mid-sentence (as in copied PDFs) are joined back together.
 */
export function toParagraphs(raw: string): string[] {
  const text = raw.replace(/\r\n?/g, '\n').replace(/ /g, ' ').trim()
  if (!text) return []
  const blocks = /\n\s*\n/.test(text) ? text.split(/\n\s*\n/) : text.split('\n')
  return blocks.map((b) => b.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
}

export function defaultTitle(paragraphs: string[]): string {
  const words = (paragraphs[0] ?? '').split(' ').slice(0, 7).join(' ')
  return words.length < (paragraphs[0] ?? '').length ? `${words}…` : words || 'Untitled'
}

export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export async function saveText(text: Omit<TextRow, 'id' | 'addedAt' | 'wordCount'> & { id?: string }): Promise<string> {
  const row: TextRow = {
    ...text,
    id: text.id ?? newId(),
    addedAt: Date.now(),
    wordCount: countWords(text.chapters),
  }
  await db.texts.put(row)
  return row.id
}

export async function deleteText(id: string) {
  await db.transaction('rw', db.texts, db.progress, async () => {
    await db.texts.delete(id)
    await db.progress.delete(id)
  })
}

export async function saveProgress(text: TextRow, chapter: number, position: number) {
  const percent = Math.min(1, (chapter + position) / text.chapters.length)
  await db.progress.put({ textId: text.id, chapter, position, percent, updatedAt: Date.now() })
}

/** Rough reading time at an unhurried 200 words per minute. */
export function readingTime(words: number): string {
  const minutes = Math.max(1, Math.round(words / 200))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}
