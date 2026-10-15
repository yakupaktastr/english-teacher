import { useEffect, useState } from 'react'
import TabBar, { type Tab } from './components/TabBar'
import Today from './screens/Today'
import Words from './screens/Words'
import WordDetail from './screens/WordDetail'
import Read from './screens/Read'
import Settings from './screens/Settings'
import Session from './screens/Session'
import { useSettings } from './settings'
import { useApplyTheme } from './theme'
import { useWords } from './words'

const TABS: Tab[] = ['today', 'words', 'read', 'settings']

// Routes live in the URL hash: #/today, #/words/abandon, #/learn, #/review
function readPath(): string[] {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
}

export default function App() {
  const settings = useSettings()
  const index = useWords()
  const [path, setPath] = useState(readPath)
  useApplyTheme(settings.theme)

  useEffect(() => {
    navigator.storage?.persist?.()
    const onHashChange = () => {
      setPath(readPath())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (to: string) => {
    location.hash = `#/${to}`
  }

  const [first, second] = path

  if (first === 'learn' || first === 'review') {
    return (
      <main className="content session-content">
        {index ? (
          <Session key={first} mode={first} index={index} onClose={() => navigate('today')} />
        ) : (
          <p className="empty">Loading words…</p>
        )}
      </main>
    )
  }

  const tab: Tab = TABS.includes(first as Tab) ? (first as Tab) : 'today'
  return (
    <div className="app">
      <main className="content">
        {tab === 'today' && <Today navigate={navigate} />}
        {tab === 'words' && (second ? <WordDetail word={second} index={index} /> : <Words index={index} navigate={navigate} />)}
        {tab === 'read' && <Read />}
        {tab === 'settings' && <Settings />}
      </main>
      <TabBar active={tab} onChange={(next) => navigate(next)} />
    </div>
  )
}
