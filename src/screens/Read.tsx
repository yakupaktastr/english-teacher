import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { readingTime } from '../texts'

export default function Read({ navigate }: { navigate: (path: string) => void }) {
  const items = useLiveQuery(async () => {
    const [texts, progress] = await Promise.all([db.texts.toArray(), db.progress.toArray()])
    const byText = new Map(progress.map((p) => [p.textId, p]))
    return texts
      .map(({ chapters, ...meta }) => ({ ...meta, chapterCount: chapters.length, progress: byText.get(meta.id) }))
      .sort((a, b) => (b.progress?.updatedAt ?? b.addedAt) - (a.progress?.updatedAt ?? a.addedAt))
  }, [])

  if (!items) return <section className="screen" />

  return (
    <section className="screen">
      <div className="title-row">
        <h1>Read</h1>
        <button className="text-button" onClick={() => navigate('read/add')}>
          + Add text
        </button>
      </div>

      {items.length === 0 && (
        <p className="empty">
          Your library is empty.
          <br />
          Paste an article or story with “Add text”.
        </p>
      )}

      <ul className="library">
        {items.map((item) => {
          const percent = Math.round((item.progress?.percent ?? 0) * 100)
          return (
            <li key={item.id}>
              <button onClick={() => navigate(`read/${item.id}`)}>
                <span className="library-title">{item.title}</span>
                <span className="library-meta">
                  {[item.author, item.source, readingTime(item.wordCount)].filter(Boolean).join(' · ')}
                </span>
                <span className="library-progress">
                  <span className="bar">
                    <span style={{ width: `${percent}%` }} />
                  </span>
                  <span className="muted">{percent >= 99 ? 'Finished' : percent > 0 ? `${percent}%` : 'Not started'}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
