import { describe, expect, it } from 'vitest'
import sample from '../data/content/sample.json'
import { checkTyped, makeExercise, makeExerciseOfKind } from './exercises'
import { findInSentence, type Word, type WordIndex } from './words'

const list = sample.map((w) => ({ ...w, level: 'b2' })) as Word[]
const index: WordIndex = { list, byWord: new Map(list.map((w) => [w.word, w])) }
const abandon = index.byWord.get('abandon')!

describe('findInSentence', () => {
  it('finds inflected forms', () => {
    expect(findInSentence('The puppy had been abandoned on the road.', 'abandon')?.text).toBe('abandoned')
    expect(findInSentence('She was studying all night.', 'study')?.text).toBe('studying')
    expect(findInSentence('He stopped suddenly.', 'stop')?.text).toBe('stopped')
    expect(findInSentence('Prices are rising.', 'rise')?.text).toBe('rising')
  })

  it('does not match a different word that starts the same way', () => {
    expect(findInSentence('The candidate spoke first.', 'can')).toBeNull()
  })

  it('finds multi-word headwords', () => {
    expect(findInSentence('According to the report, sales fell.', 'according to')?.text).toBe('According to')
  })
})

describe('exercises', () => {
  it('blanks the word in cloze sentences and expects the inflected form', () => {
    const ex = makeExerciseOfKind('clozeType', abandon, index, () => 0)
    expect(ex.prompt).not.toMatch(/abandon/i)
    expect(ex.prompt).toContain('a__')
    expect(['abandoned', 'abandon']).toContain(ex.answer)
  })

  it('includes the right answer among four distinct options', () => {
    for (let i = 0; i < 20; i++) {
      const ex = makeExerciseOfKind('fromTurkish', abandon, index)
      expect(ex.options).toContain('abandon')
      expect(new Set(ex.options).size).toBe(ex.options!.length)
    }
  })

  it('uses easier exercises for new words and harder ones for strong memories', () => {
    const easy = new Set(['meaning', 'flip', 'fromTurkish'])
    const hard = new Set(['produce', 'collocation', 'clozeType'])
    for (let i = 0; i < 20; i++) {
      expect(easy.has(makeExercise(abandon, 0, index).kind)).toBe(true)
      expect(hard.has(makeExercise(abandon, 100, index).kind)).toBe(true)
    }
  })
})

describe('checkTyped', () => {
  it('accepts exact answers regardless of case and spaces', () => {
    expect(checkTyped('  Abandoned ', 'abandoned')).toBe('correct')
  })
  it('treats a one-letter slip in a long word as a typo', () => {
    expect(checkTyped('abandonned', 'abandoned')).toBe('typo')
    expect(checkTyped('bare', 'bear')).toBe('wrong')
  })
})
