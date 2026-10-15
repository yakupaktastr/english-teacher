import { findInSentence, type Word, type WordIndex } from './words'

export type ExerciseKind =
  | 'flip' // see the word, recall the meaning, rate yourself
  | 'meaning' // word → pick the Turkish meaning
  | 'fromTurkish' // Turkish meaning → pick the word
  | 'fromDefinition' // English definition → pick the word
  | 'clozeChoice' // sentence with a gap → pick the word
  | 'clozeType' // sentence with a gap → type the word
  | 'collocation' // collocation with a gap → type the word
  | 'produce' // Turkish meaning + definition → type the word

export interface Exercise {
  kind: ExerciseKind
  word: Word
  /** Small heading above the prompt, e.g. "Choose the meaning". */
  instruction: string
  prompt: string
  /** Secondary line under the prompt (e.g. the Turkish meaning for a cloze). */
  hint?: string
  /** For choice exercises. */
  options?: string[]
  /** The expected answer (option text or the text to type). */
  answer: string
}

// Harder exercises unlock as memory stability (in days) grows.
const TIERS: { minStability: number; kinds: ExerciseKind[] }[] = [
  { minStability: 45, kinds: ['produce', 'collocation', 'clozeType'] },
  { minStability: 14, kinds: ['clozeType', 'collocation', 'fromDefinition'] },
  { minStability: 4, kinds: ['fromDefinition', 'clozeChoice', 'clozeType'] },
  { minStability: 1, kinds: ['fromTurkish', 'clozeChoice', 'flip'] },
  { minStability: 0, kinds: ['meaning', 'flip', 'fromTurkish'] },
]

type Random = () => number

function shuffle<T>(items: T[], random: Random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function blank(text: string, start: number, length: number, reveal = '') {
  return text.slice(0, start) + reveal + '_'.repeat(Math.max(3, length - reveal.length)) + text.slice(start + length)
}

/** Picks 3 other words of the same part of speech, preferring the same level. */
function distractors(word: Word, index: WordIndex, random: Random, label: (w: Word) => string): string[] {
  const pos = word.senses[0]?.pos
  const own = label(word)
  const pool = index.list.filter((w) => w.word !== word.word && w.senses[0]?.pos === pos && label(w) !== own)
  const sameLevel = pool.filter((w) => w.level === word.level)
  const source = sameLevel.length >= 10 ? sameLevel : pool
  const picked: string[] = []
  for (const w of shuffle(source, random)) {
    const text = label(w)
    if (!picked.includes(text)) picked.push(text)
    if (picked.length === 3) break
  }
  return picked
}

function withOptions(answer: string, others: string[], random: Random) {
  return shuffle([answer, ...others], random)
}

function build(kind: ExerciseKind, word: Word, index: WordIndex, random: Random): Exercise | null {
  const sense = word.senses[0]
  switch (kind) {
    case 'flip':
      return { kind, word, instruction: 'Do you remember it?', prompt: word.word, answer: word.word }

    case 'meaning':
      return {
        kind,
        word,
        instruction: 'Choose the meaning',
        prompt: word.word,
        options: withOptions(sense.tr, distractors(word, index, random, (w) => w.senses[0].tr), random),
        answer: sense.tr,
      }

    case 'fromTurkish':
      return {
        kind,
        word,
        instruction: 'Which word means this?',
        prompt: sense.tr,
        options: withOptions(word.word, distractors(word, index, random, (w) => w.word), random),
        answer: word.word,
      }

    case 'fromDefinition': {
      const s = word.senses[Math.floor(random() * word.senses.length)]
      return {
        kind,
        word,
        instruction: 'Which word fits the definition?',
        prompt: s.def,
        options: withOptions(word.word, distractors(word, index, random, (w) => w.word), random),
        answer: word.word,
      }
    }

    case 'clozeChoice':
    case 'clozeType': {
      const candidates = word.senses.flatMap((s) =>
        s.examples.map((ex) => ({ s, ex, found: findInSentence(ex, word.word) })).filter((c) => c.found),
      )
      if (!candidates.length) return null
      const { s, ex, found } = candidates[Math.floor(random() * candidates.length)]
      const { start, text } = found!
      if (kind === 'clozeChoice') {
        return {
          kind,
          word,
          instruction: 'Complete the sentence',
          prompt: blank(ex, start, text.length),
          hint: s.tr,
          options: withOptions(word.word, distractors(word, index, random, (w) => w.word), random),
          answer: word.word,
        }
      }
      return {
        kind,
        word,
        instruction: 'Type the missing word',
        prompt: blank(ex, start, text.length, text[0]),
        hint: s.tr,
        answer: text,
      }
    }

    case 'collocation': {
      const usable = word.collocations
        .map((c) => ({ c, found: findInSentence(c, word.word) }))
        .filter((x) => x.found && x.c.trim().toLowerCase() !== x.found.text.toLowerCase())
      if (!usable.length) return null
      const { c, found } = usable[Math.floor(random() * usable.length)]
      return {
        kind,
        word,
        instruction: 'Complete the collocation',
        prompt: blank(c, found!.start, found!.text.length, found!.text[0]),
        hint: sense.tr,
        answer: found!.text,
      }
    }

    case 'produce':
      return {
        kind,
        word,
        instruction: 'Type the word',
        prompt: sense.tr,
        hint: sense.def,
        answer: word.word,
      }
  }
}

/** Chooses a suitable exercise for a word given its memory stability in days. */
export function makeExercise(word: Word, stability: number, index: WordIndex, random: Random = Math.random): Exercise {
  const tier = TIERS.find((t) => stability >= t.minStability)!
  for (const kind of shuffle(tier.kinds, random)) {
    const exercise = build(kind, word, index, random)
    if (exercise) return exercise
  }
  return build('flip', word, index, random)!
}

/** Builds a specific exercise kind (falls back to 'meaning' when not possible). */
export function makeExerciseOfKind(kind: ExerciseKind, word: Word, index: WordIndex, random: Random = Math.random) {
  return build(kind, word, index, random) ?? build('meaning', word, index, random)!
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = temp
    }
  }
  return row[b.length]
}

export type Verdict = 'correct' | 'typo' | 'wrong'

/** Compares a typed answer; one-letter slips in longer words count as a typo. */
export function checkTyped(input: string, answer: string): Verdict {
  const a = input.trim().toLowerCase().replace(/[’]/g, "'")
  const b = answer.trim().toLowerCase()
  if (a === b) return 'correct'
  if (b.length > 4 && levenshtein(a, b) === 1) return 'typo'
  return 'wrong'
}
