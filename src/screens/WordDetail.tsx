import { useLiveQuery } from 'dexie-react-hooks'
import WordCard from '../components/WordCard'
import { db } from '../db'
import { describeInterval, markKnown, resetWord, startLearning } from '../srs'
import type { WordIndex } from '../words'

export default function WordDetail({ word, index }: { word: string; index: WordIndex | null }) {
  const card = useLiveQuery(() => db.cards.get(word), [word], null)
  const entry = index?.byWord.get(word)

  if (!index || card === null) return <section className="screen" />
  if (!entry) return <p className="empty">Word not found.</p>

  const now = Date.now()
  let status = 'New'
  if (card?.status === 'known') status = 'Marked as known'
  else if (card?.fsrs) {
    status = card.due <= now ? 'Learning · due now' : `Learning · next review in ${describeInterval(card.due - now)}`
  }

  return (
    <section className="screen">
      <button className="back" onClick={() => history.back()}>
        ‹ Words
      </button>
      <WordCard word={entry} />

      <p className="muted status-line">{status}</p>
      <div className="row-buttons">
        {!card && (
          <>
            <button className="secondary" onClick={() => markKnown(word)}>
              I know this
            </button>
            <button className="primary" onClick={() => startLearning(word)}>
              Learn
            </button>
          </>
        )}
        {card?.status === 'known' && (
          <button className="secondary" onClick={() => startLearning(word)}>
            Learn it anyway
          </button>
        )}
        {card?.status === 'learning' && (
          <button className="secondary" onClick={() => markKnown(word)}>
            Mark as known
          </button>
        )}
        {card && (
          <button
            className="secondary"
            onClick={() => confirm(`Reset all progress for "${word}"?`) && resetWord(word)}
          >
            Reset
          </button>
        )}
      </div>
    </section>
  )
}
