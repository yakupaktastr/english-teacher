import { useEffect, useState } from 'react'

export default function App() {
  const [online, setOnline] = useState(navigator.onLine)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    navigator.storage?.persist?.().then(setPersisted)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <main className="page">
      <h1>English Teacher</h1>
      <p className="muted">Version {__APP_VERSION__}</p>
      <ul className="status">
        <li>Network: {online ? 'online' : 'offline'}</li>
        <li>Persistent storage: {persisted === null ? '…' : persisted ? 'granted' : 'not granted'}</li>
        <li>Installed: {window.matchMedia('(display-mode: standalone)').matches ? 'yes' : 'no (open from home screen)'}</li>
      </ul>
    </main>
  )
}
