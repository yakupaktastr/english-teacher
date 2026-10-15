import { useEffect, useRef, useState } from 'react'
import Segmented from '../components/Segmented'
import Stepper from '../components/Stepper'
import { restoreBackup, shareBackup } from '../backup'
import { LEVELS } from '../words'
import { LINE_HEIGHTS, updateSettings, useSettings, type LineSpacing, type ReaderFont, type Theme } from '../settings'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Settings() {
  const settings = useSettings()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [storage, setStorage] = useState<{ used: number; persisted: boolean } | null>(null)

  useEffect(() => {
    Promise.all([navigator.storage?.estimate?.(), navigator.storage?.persisted?.()]).then(([estimate, persisted]) =>
      setStorage({ used: estimate?.usage ?? 0, persisted: !!persisted }),
    )
  }, [message])

  async function handleExport() {
    setMessage(null)
    try {
      if (await shareBackup()) {
        await updateSettings({ lastBackupAt: new Date().toISOString() })
        setMessage('Backup created.')
      }
    } catch (err) {
      setMessage(`Backup failed: ${(err as Error).message}`)
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    setMessage(null)
    try {
      if (!confirm('Restoring replaces all data on this device with the backup. Continue?')) return
      await restoreBackup(await file.text())
      setMessage('Backup restored.')
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <section className="screen">
      <h1>Settings</h1>

      <h2>Appearance</h2>
      <div className="group">
        <div className="row column">
          <span>Theme</span>
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
        </div>
      </div>

      <h2>Reading</h2>
      <div className="group">
        <div className="row column">
          <span>Font</span>
          <Segmented<ReaderFont>
            value={settings.readerFont}
            onChange={(readerFont) => updateSettings({ readerFont })}
            options={[
              { value: 'serif', label: 'Serif' },
              { value: 'sans', label: 'Sans' },
            ]}
          />
        </div>
        <div className="row">
          <span>Text size</span>
          <Stepper value={settings.fontSize} min={14} max={28} step={1} onChange={(fontSize) => updateSettings({ fontSize })} />
        </div>
        <div className="row column">
          <span>Line spacing</span>
          <Segmented<LineSpacing>
            value={settings.lineSpacing}
            onChange={(lineSpacing) => updateSettings({ lineSpacing })}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'relaxed', label: 'Relaxed' },
            ]}
          />
        </div>
        <p
          className={`preview font-${settings.readerFont}`}
          style={{ fontSize: settings.fontSize, lineHeight: LINE_HEIGHTS[settings.lineSpacing] }}
        >
          The most reliable way to build a rich vocabulary is to read widely and often, meeting each new word in a
          context that gives it meaning.
        </p>
      </div>

      <h2>Study</h2>
      <div className="group">
        <div className="row">
          <span>
            New words per day
            <small>A suggestion, not a limit.</small>
          </span>
          <Stepper
            value={settings.dailyNewWords}
            min={5}
            max={50}
            step={5}
            onChange={(dailyNewWords) => updateSettings({ dailyNewWords })}
          />
        </div>
        <div className="row column">
          <span>
            Levels for new words
            <small>Words you already know can be skipped with "I know this".</small>
          </span>
          <div className="chips">
            {LEVELS.map((level) => {
              const on = settings.newWordLevels.includes(level)
              return (
                <button
                  key={level}
                  className={on ? 'chip active' : 'chip'}
                  onClick={() => {
                    const next = on ? settings.newWordLevels.filter((l) => l !== level) : [...settings.newWordLevels, level]
                    if (next.length) updateSettings({ newWordLevels: LEVELS.filter((l) => next.includes(l)) })
                  }}
                >
                  {level.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>
        <div className="row column">
          <span>Order</span>
          <Segmented<'hardest' | 'easiest'>
            value={settings.newWordOrder}
            onChange={(newWordOrder) => updateSettings({ newWordOrder })}
            options={[
              { value: 'hardest', label: 'Hardest first' },
              { value: 'easiest', label: 'Easiest first' },
            ]}
          />
        </div>
      </div>

      <h2>Data</h2>
      <div className="group">
        <button className="row link" onClick={handleExport}>
          <span>
            Back up data
            <small>{settings.lastBackupAt ? `Last backup: ${formatDate(settings.lastBackupAt)}` : 'No backup yet'}</small>
          </span>
        </button>
        <button className="row link" onClick={() => fileInput.current?.click()}>
          <span>Restore from backup</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => handleImport(e.target.files?.[0])}
        />
        {storage && (
          <div className="row">
            <span>Storage</span>
            <span className="muted">
              {formatBytes(storage.used)} · {storage.persisted ? 'persistent' : 'not persistent'}
            </span>
          </div>
        )}
      </div>
      {message && <p className="message">{message}</p>}

      <p className="footer">English Teacher · {__APP_VERSION__}</p>
    </section>
  )
}
