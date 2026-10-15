import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Segmented from '../components/Segmented'
import Stepper from '../components/Stepper'
import { db, type TextRow } from '../db'
import { deleteText, saveProgress } from '../texts'
import { LINE_HEIGHTS, updateSettings, useSettings, type LineSpacing, type ReaderFont, type Theme } from '../settings'

type Panel = null | 'display' | 'contents'

export default function Reader({ id, onClose }: { id: string; onClose: () => void }) {
  const text = useLiveQuery(() => db.texts.get(id), [id], null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const restoreTo = useRef<number | null>(null)

  // Open at the saved chapter and scroll position.
  useEffect(() => {
    db.progress.get(id).then((p) => {
      restoreTo.current = p?.position ?? 0
      setChapter(p?.chapter ?? 0)
    })
  }, [id])

  if (text === null || chapter === null) return <div className="reader" />
  if (!text) {
    return (
      <div className="reader">
        <p className="empty">This text is no longer in your library.</p>
      </div>
    )
  }

  const goTo = (index: number) => {
    restoreTo.current = 0
    setChapter(index)
    setPanel(null)
    saveProgress(text, index, 0)
  }

  return (
    <div className="reader">
      <header className="reader-bar">
        <button onClick={onClose} aria-label="Back">
          ‹
        </button>
        <span className="reader-title">{text.title}</span>
        {text.chapters.length > 1 && (
          <button onClick={() => setPanel(panel === 'contents' ? null : 'contents')} aria-label="Contents">
            ☰
          </button>
        )}
        <button onClick={() => setPanel(panel === 'display' ? null : 'display')} aria-label="Display settings">
          Aa
        </button>
      </header>

      <ChapterView key={chapter} text={text} chapter={chapter} restoreTo={restoreTo} />

      <nav className="chapter-nav">
        {chapter > 0 && (
          <button className="secondary" onClick={() => goTo(chapter - 1)}>
            ‹ Previous
          </button>
        )}
        {chapter < text.chapters.length - 1 ? (
          <button className="primary" onClick={() => goTo(chapter + 1)}>
            Next chapter ›
          </button>
        ) : (
          <p className="muted the-end">The end</p>
        )}
      </nav>

      {panel && <div className="sheet-backdrop" onClick={() => setPanel(null)} />}
      {panel === 'display' && <DisplaySheet onDelete={async () => {
        if (confirm(`Remove "${text.title}" from your library?`)) {
          await deleteText(text.id)
          onClose()
        }
      }} />}
      {panel === 'contents' && (
        <div className="sheet">
          <h3>Contents</h3>
          <ol className="contents">
            {text.chapters.map((c, i) => (
              <li key={i}>
                <button className={i === chapter ? 'active' : ''} onClick={() => goTo(i)}>
                  {c.title || `Chapter ${i + 1}`}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function ChapterView({ text, chapter, restoreTo }: { text: TextRow; chapter: number; restoreTo: React.RefObject<number | null> }) {
  const settings = useSettings()
  const current = text.chapters[chapter]

  // Restore the scroll position once the chapter is on screen.
  useLayoutEffect(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, (restoreTo.current ?? 0) * max)
    restoreTo.current = null
  }, [restoreTo])

  // Remember where the reader is, at most twice a second.
  useEffect(() => {
    let timer: number | undefined
    const onScroll = () => {
      if (timer) return
      timer = window.setTimeout(() => {
        timer = undefined
        const max = document.documentElement.scrollHeight - window.innerHeight
        saveProgress(text, chapter, max > 0 ? Math.min(1, window.scrollY / max) : 1)
      }, 500)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [text, chapter])

  return (
    <article
      className={`reader-text font-${settings.readerFont}`}
      style={{ fontSize: settings.fontSize, lineHeight: LINE_HEIGHTS[settings.lineSpacing] }}
    >
      {chapter === 0 && (
        <header className="reader-head">
          <h1>{text.title}</h1>
          {(text.author || text.source) && <p className="muted">{[text.author, text.source].filter(Boolean).join(' · ')}</p>}
        </header>
      )}
      {current.title && <h2 className="chapter-title">{current.title}</h2>}
      {current.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </article>
  )
}

function DisplaySheet({ onDelete }: { onDelete: () => void }) {
  const settings = useSettings()
  return (
    <div className="sheet">
      <div className="sheet-row">
        <span>Text size</span>
        <Stepper value={settings.fontSize} min={14} max={28} step={1} onChange={(fontSize) => updateSettings({ fontSize })} />
      </div>
      <Segmented<ReaderFont>
        value={settings.readerFont}
        onChange={(readerFont) => updateSettings({ readerFont })}
        options={[
          { value: 'serif', label: 'Serif' },
          { value: 'sans', label: 'Sans' },
        ]}
      />
      <Segmented<LineSpacing>
        value={settings.lineSpacing}
        onChange={(lineSpacing) => updateSettings({ lineSpacing })}
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'normal', label: 'Normal' },
          { value: 'relaxed', label: 'Relaxed' },
        ]}
      />
      <Segmented<Theme>
        value={settings.theme}
        onChange={(theme) => updateSettings({ theme })}
        options={[
          { value: 'system', label: 'Auto' },
          { value: 'light', label: 'Light' },
          { value: 'sepia', label: 'Sepia' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
      <button className="danger-link" onClick={onDelete}>
        Remove from library
      </button>
    </div>
  )
}
