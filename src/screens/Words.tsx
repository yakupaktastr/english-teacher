import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Segmented from '../components/Segmented'
import { db, type CardRow } from '../db'
import { LEVELS, type Level, type WordIndex } from '../words'

type Filter = 'all' | 'new' | 'learning' | 'known'
const PAGE = 100

export default function Words({ index, navigate }: { index: WordIndex | null; navigate: (path: string) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [level, setLevel] = useState<Level | 'awl' | null>(null)
  const [limit, setLimit] = useState(PAGE)

  const cards = useLiveQuery(async () => new Map((await db.cards.toArray()).map((c) => [c.word, c] as [string, CardRow])), [])

  const results = useMemo(() => {
    if (!index || !cards) return []
    const q = query.trim().toLowerCase()
    return index.list.filter((w) => {
      if (level === 'awl' ? !w.awl : level && w.level !== level) return false
      const status = cards.get(w.word)?.status ?? 'new'
      if (filter !== 'all' && status !== filter) return false
      if (!q) return true
      return w.word.toLowerCase().startsWith(q) || w.senses.some((s) => s.tr.toLowerCase().includes(q))
    })
  }, [index, cards, query, filter, level])

  if (!index || !cards) return <section className="screen" />

  const counts = { learning: 0, known: 0 }
  for (const c of cards.values()) counts[c.status]++

  return (
    <section className="screen">
      <h1>Words</h1>
      <p className="muted summary">
        {index.list.length} words · {counts.learning} learning · {counts.known} known
      </p>

      <input
        className="search"
        type="search"
        placeholder="Search English or Turkish"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setLimit(PAGE)
        }}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <Segmented<Filter>
        value={filter}
        onChange={(f) => {
          setFilter(f)
          setLimit(PAGE)
        }}
        options={[
          { value: 'all', label: 'All' },
          { value: 'new', label: 'New' },
          { value: 'learning', label: 'Learning' },
          { value: 'known', label: 'Known' },
        ]}
      />

      <div className="chips">
        {[...LEVELS, 'awl' as const].map((l) => (
          <button
            key={l}
            className={level === l ? 'chip active' : 'chip'}
            onClick={() => {
              setLevel(level === l ? null : l)
              setLimit(PAGE)
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <ul className="word-list">
        {results.slice(0, limit).map((w) => {
          const status = cards.get(w.word)?.status ?? 'new'
          return (
            <li key={w.word}>
              <button onClick={() => navigate(`words/${encodeURIComponent(w.word)}`)}>
                <span className={`dot ${status}`} aria-label={status} />
                <span className="word-list-main">
                  <span className="word-list-word">{w.word}</span>
                  <span className="word-list-tr">{w.senses[0]?.tr}</span>
                </span>
                <span className="level">{w.level.toUpperCase()}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {results.length === 0 && <p className="empty">No words found.</p>}
      {results.length > limit && (
        <button className="secondary wide" onClick={() => setLimit(limit + PAGE)}>
          Show more ({results.length - limit} left)
        </button>
      )}
    </section>
  )
}
