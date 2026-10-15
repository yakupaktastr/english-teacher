import { useEffect, useRef, useState } from 'react'
import { Rating, type Grade } from 'ts-fsrs'
import { checkTyped, type Exercise, type Verdict } from '../exercises'
import WordCard, { SpeakButton } from './WordCard'

const SLOW_ANSWER_MS = 15000

function gradeFor(verdict: Verdict, elapsed: number): Grade {
  if (verdict === 'wrong') return Rating.Again
  if (verdict === 'typo' || elapsed > SLOW_ANSWER_MS) return Rating.Hard
  return Rating.Good
}

const FEEDBACK: Record<Verdict, string> = {
  correct: 'Correct',
  typo: 'Almost — check the spelling',
  wrong: 'Not quite',
}

interface Props {
  exercise: Exercise
  onDone: (grade: Grade) => void
}

export default function ExerciseView({ exercise, onDone }: Props) {
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [revealed, setRevealed] = useState(false)
  const startedAt = useRef(Date.now())
  const answerTime = useRef(0)
  const input = useRef<HTMLInputElement>(null)

  const isTyping = !exercise.options && exercise.kind !== 'flip'

  useEffect(() => {
    if (isTyping) input.current?.focus()
  }, [isTyping])

  function finish(result: Verdict) {
    answerTime.current = Date.now() - startedAt.current
    setVerdict(result)
    input.current?.blur()
  }

  function choose(option: string) {
    if (verdict) return
    setPicked(option)
    finish(option === exercise.answer ? 'correct' : 'wrong')
  }

  function submitTyped(e: React.FormEvent) {
    e.preventDefault()
    if (verdict || !typed.trim()) return
    finish(checkTyped(typed, exercise.answer))
  }

  const showsWord = exercise.kind === 'flip' || exercise.kind === 'meaning'

  return (
    <div className="exercise">
      <p className="instruction">{exercise.instruction}</p>

      <div className="prompt-box">
        <p className={showsWord ? 'prompt prompt-word' : 'prompt'}>{exercise.prompt}</p>
        {showsWord && <SpeakButton text={exercise.word.word} />}
        {exercise.hint && <p className="prompt-hint">{exercise.hint}</p>}
      </div>

      {exercise.kind === 'flip' &&
        (revealed ? (
          <>
            <WordCard word={exercise.word} compact />
            <div className="grades">
              <button onClick={() => onDone(Rating.Again)}>Forgot</button>
              <button onClick={() => onDone(Rating.Hard)}>Hard</button>
              <button onClick={() => onDone(Rating.Good)}>Good</button>
              <button onClick={() => onDone(Rating.Easy)}>Easy</button>
            </div>
          </>
        ) : (
          <button className="primary wide" onClick={() => setRevealed(true)}>
            Show answer
          </button>
        ))}

      {exercise.options && (
        <div className="options">
          {exercise.options.map((option) => {
            let state = ''
            if (verdict && option === exercise.answer) state = 'right'
            else if (verdict && option === picked) state = 'wrong'
            return (
              <button key={option} className={`option ${state}`} onClick={() => choose(option)} disabled={!!verdict}>
                {option}
              </button>
            )
          })}
        </div>
      )}

      {isTyping && (
        <form className="typing" onSubmit={submitTyped}>
          <input
            ref={input}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={!!verdict}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="Type here"
            className={verdict ? `typed ${verdict}` : 'typed'}
          />
          {!verdict && (
            <div className="row-buttons">
              <button type="button" className="secondary" onClick={() => finish('wrong')}>
                I don't know
              </button>
              <button type="submit" className="primary" disabled={!typed.trim()}>
                Check
              </button>
            </div>
          )}
        </form>
      )}

      {verdict && (
        <div className="feedback">
          <p className={`verdict ${verdict}`}>
            {FEEDBACK[verdict]}
            {verdict !== 'correct' && isTyping && (
              <>
                : <strong>{exercise.answer}</strong>
              </>
            )}
          </p>
          <WordCard word={exercise.word} compact />
          <button className="primary wide" onClick={() => onDone(gradeFor(verdict, answerTime.current))}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
