import type { Word } from '../words'
import { speak } from '../speech'

export function SpeakButton({ text }: { text: string }) {
  return (
    <button className="speak" onClick={() => speak(text)} aria-label={`Pronounce ${text}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
      </svg>
    </button>
  )
}

export function WordHeader({ word }: { word: Word }) {
  return (
    <div className="word-header">
      <div>
        <h2 className="headword">{word.word}</h2>
        <span className="ipa">{word.ipa}</span>
        <span className="level">{word.level.toUpperCase()}</span>
        {word.awl && <span className="level">AWL</span>}
      </div>
      <SpeakButton text={word.word} />
    </div>
  )
}

/** The full word card: meanings, examples, collocations, synonyms, family, note. */
export default function WordCard({ word, compact = false }: { word: Word; compact?: boolean }) {
  return (
    <article className="word-card">
      <WordHeader word={word} />

      {word.senses.map((sense, i) => (
        <section key={i} className="sense">
          <div className="sense-head">
            <span className="pos">{sense.pos}</span>
            <span className="tr">{sense.tr}</span>
          </div>
          <p className="def">{sense.def}</p>
          {(compact ? sense.examples.slice(0, 1) : sense.examples).map((ex) => (
            <p key={ex} className="example">
              {ex}
            </p>
          ))}
        </section>
      ))}

      {!compact && (
        <>
          {word.collocations.length > 0 && (
            <section className="extra">
              <h3>Collocations</h3>
              <p>{word.collocations.join(' · ')}</p>
            </section>
          )}
          {word.synonyms.length > 0 && (
            <section className="extra">
              <h3>Synonyms</h3>
              <p>{word.synonyms.join(' · ')}</p>
            </section>
          )}
          {word.family.length > 0 && (
            <section className="extra">
              <h3>Word family</h3>
              <p>
                {word.family.map((f, i) => (
                  <span key={f.word}>
                    {i > 0 && ' · '}
                    {f.word} <span className="muted">({f.pos})</span>
                  </span>
                ))}
              </p>
            </section>
          )}
          {word.note && <p className="note">{word.note}</p>}
        </>
      )}
    </article>
  )
}
