import { useEffect, useRef, useState } from 'react'
import type { Grade } from 'ts-fsrs'
import ExerciseView from '../components/ExerciseView'
import WordCard from '../components/WordCard'
import { makeExercise, makeExerciseOfKind, type Exercise } from '../exercises'
import { answer, dueCards, markKnown, nextNewWords, stabilityOf, startLearning } from '../srs'
import { getSettings } from '../settings'
import { db } from '../db'
import type { Word, WordIndex } from '../words'

/** Words due again within this window are shown again before the session ends. */
const REQUEUE_WINDOW = 20 * 60 * 1000
const LEARN_BATCH = 5

type Step =
  | { kind: 'loading' }
  | { kind: 'intro'; candidates: Word[]; learned: Word[]; skipped: string[] }
  | { kind: 'exercise'; exercise: Exercise; queue: string[]; seq: number }
  | { kind: 'done'; learned: number }

interface Props {
  mode: 'learn' | 'review'
  index: WordIndex
  onClose: () => void
}

export default function Session({ mode, index, onClose }: Props) {
  const [step, setStep] = useState<Step>({ kind: 'loading' })
  const [reviewed, setReviewed] = useState(0)
  const [total, setTotal] = useState(0)
  const [round, setRound] = useState(0) // bumps to start another learn batch
  const seq = useRef(0)
  const nextSeq = () => ++seq.current

  useEffect(() => {
    let active = true
    async function start() {
      if (mode === 'review') {
        const due = (await dueCards()).filter((row) => index.byWord.has(row.word))
        due.sort((a, b) => a.due - b.due)
        if (!active) return
        setTotal(due.length)
        await showNext(due.map((row) => row.word))
      } else {
        const candidates = await nextNewWords(index, await getSettings(), 20)
        if (active) setStep({ kind: 'intro', candidates, learned: [], skipped: [] })
      }
    }
    start()
    return () => {
      active = false
    }
  }, [mode, round])

  async function showNext(queue: string[], learned = 0) {
    const [next, ...rest] = queue
    if (!next) {
      setStep({ kind: 'done', learned })
      return
    }
    const word = index.byWord.get(next)!
    const row = await db.cards.get(next)
    setStep({ kind: 'exercise', exercise: makeExercise(word, stabilityOf(row), index), queue: rest, seq: nextSeq() })
  }

  // --- Learn mode: introduce words one by one ---

  async function decide(word: Word, learn: boolean) {
    if (step.kind !== 'intro') return
    if (learn) await startLearning(word.word)
    else await markKnown(word.word)

    const learned = learn ? [...step.learned, word] : step.learned
    const skipped = [...step.skipped, word.word]
    let candidates = step.candidates.filter((w) => w.word !== word.word)
    if (candidates.length === 0 && learned.length < LEARN_BATCH) {
      candidates = await nextNewWords(index, await getSettings(), 20, skipped)
    }

    if (learned.length >= LEARN_BATCH || candidates.length === 0) {
      if (learned.length === 0) {
        setStep({ kind: 'done', learned: 0 })
        return
      }
      // Practice the new words: first a meaning check for each.
      setTotal(learned.length)
      setStep({
        kind: 'exercise',
        exercise: makeExerciseOfKind('meaning', learned[0], index),
        queue: learned.slice(1).map((w) => w.word),
        seq: nextSeq(),
      })
      return
    }
    setStep({ kind: 'intro', candidates, learned, skipped })
  }

  // --- Both modes: answer an exercise ---

  async function handleAnswer(grade: Grade) {
    if (step.kind !== 'exercise') return
    const { exercise, queue } = step
    const row = await answer(exercise.word.word, grade, exercise.kind)
    const again = row.due - Date.now() < REQUEUE_WINDOW
    if (!again) setReviewed((n) => n + 1)
    await showNext(again ? [...queue, exercise.word.word] : queue, total)
  }

  const progress = total ? Math.min(1, reviewed / total) : 0

  return (
    <div className="session">
      <header className="session-bar">
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="progress">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      {step.kind === 'loading' && <p className="empty">Loading…</p>}

      {step.kind === 'intro' && step.candidates[0] && (
        <div className="intro">
          <p className="instruction">
            New word · {step.learned.length}/{LEARN_BATCH}
          </p>
          <WordCard key={step.candidates[0].word} word={step.candidates[0]} />
          <div className="row-buttons sticky">
            <button className="secondary" onClick={() => decide(step.candidates[0], false)}>
              I know this
            </button>
            <button className="primary" onClick={() => decide(step.candidates[0], true)}>
              Learn
            </button>
          </div>
        </div>
      )}

      {step.kind === 'exercise' && (
        <ExerciseView key={step.seq} exercise={step.exercise} onDone={handleAnswer} />
      )}

      {step.kind === 'done' && (
        <div className="done">
          {mode === 'review' ? (
            <>
              <h2>All done</h2>
              <p className="muted">{total ? `You reviewed ${total} words.` : 'Nothing is due right now.'}</p>
            </>
          ) : (
            <>
              <h2>{step.learned ? 'Nice work' : 'No new words'}</h2>
              <p className="muted">
                {step.learned
                  ? `${step.learned} new words added. They will come back for review.`
                  : 'There are no new words left for the selected levels.'}
              </p>
            </>
          )}
          <div className="row-buttons">
            {mode === 'learn' && step.learned > 0 && (
              <button
                className="secondary"
                onClick={() => {
                  setReviewed(0)
                  setTotal(0)
                  setStep({ kind: 'loading' })
                  setRound((r) => r + 1)
                }}
              >
                Learn 5 more
              </button>
            )}
            <button className="primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
