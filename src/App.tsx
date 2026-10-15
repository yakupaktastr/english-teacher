import { useEffect, useState, type ComponentType } from 'react'
import TabBar, { type Tab } from './components/TabBar'
import Today from './screens/Today'
import Words from './screens/Words'
import Read from './screens/Read'
import Settings from './screens/Settings'
import { useSettings } from './settings'
import { useApplyTheme } from './theme'

const SCREENS: Record<Tab, ComponentType> = { today: Today, words: Words, read: Read, settings: Settings }

function tabFromHash(): Tab {
  const tab = location.hash.replace('#/', '')
  return tab in SCREENS ? (tab as Tab) : 'today'
}

export default function App() {
  const settings = useSettings()
  const [tab, setTab] = useState<Tab>(tabFromHash)
  useApplyTheme(settings.theme)

  useEffect(() => {
    navigator.storage?.persist?.()
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const Screen = SCREENS[tab]
  return (
    <div className="app">
      <main className="content">
        <Screen />
      </main>
      <TabBar
        active={tab}
        onChange={(next) => {
          location.hash = `#/${next}`
          window.scrollTo(0, 0)
        }}
      />
    </div>
  )
}
