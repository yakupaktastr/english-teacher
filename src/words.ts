import { useEffect, useState } from 'react'

export type Level = 'a1' | 'a2' | 'b1' | 'b2' | 'c1'
export const LEVELS: Level[] = ['a1', 'a2', 'b1', 'b2', 'c1']

export interface Sense {
  pos: string
  tr: string
  def: string
  examples: string[]
}

export interface Word {
  word: string
  level: Level
  awl?: number
  ipa: string
  senses: Sense[]
  collocations: string[]
  synonyms: string[]
  family: { word: string; pos: string }[]
  note?: string
}

export interface WordIndex {
  list: Word[]
  byWord: Map<string, Word>
}

let loading: Promise<WordIndex> | null = null

export function loadWords(): Promise<WordIndex> {
  loading ??= fetch(`${import.meta.env.BASE_URL}data/words.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`Could not load words (${res.status})`)
      return res.json() as Promise<Word[]>
    })
    .then((list) => ({ list, byWord: new Map(list.map((w) => [w.word, w])) }))
  loading.catch(() => (loading = null))
  return loading
}

export function useWords(): WordIndex | null {
  const [index, setIndex] = useState<WordIndex | null>(null)
  useEffect(() => {
    let active = true
    loadWords().then((i) => active && setIndex(i))
    return () => {
      active = false
    }
  }, [])
  return index
}

/** Inflected forms of a single-word headword, for finding it inside a sentence. */
export function inflections(word: string): Set<string> {
  const w = word.toLowerCase()
  const forms = new Set([w, `${w}s`, `${w}es`, `${w}ed`, `${w}d`, `${w}ing`, `${w}er`, `${w}est`, `${w}ly`])
  if (w.endsWith('e')) forms.add(`${w.slice(0, -1)}ing`)
  if (w.endsWith('ie')) forms.add(`${w.slice(0, -2)}ying`)
  if (/[^aeiou]y$/.test(w)) {
    const base = w.slice(0, -1)
    for (const end of ['ies', 'ied', 'ier', 'iest', 'ily']) forms.add(base + end)
  }
  // Doubled final consonant: stop → stopped, stopping; big → bigger.
  if (/[^aeiou][aeiou][bdfgklmnprtvz]$/.test(w)) {
    const last = w.at(-1)
    for (const end of ['ed', 'ing', 'er', 'est']) forms.add(w + last + end)
  }
  return forms
}

/**
 * Finds the headword (or an inflected form of it) in a sentence.
 * Returns the exact text that appears, or null when it cannot be found.
 */
export function findInSentence(sentence: string, word: string): { start: number; text: string } | null {
  if (/[\s-]/.test(word)) {
    const i = sentence.toLowerCase().indexOf(word.toLowerCase())
    return i === -1 ? null : { start: i, text: sentence.slice(i, i + word.length) }
  }
  const forms = inflections(word)
  for (const match of sentence.matchAll(/[A-Za-z']+/g)) {
    if (forms.has(match[0].toLowerCase())) return { start: match.index, text: match[0] }
  }
  return null
}
