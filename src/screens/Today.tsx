import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { dayStart, describeInterval } from '../srs'
import { useSettings } from '../settings'

export default function Today({ navigate }: { navigate: (path: string) => void }) {
  const settings = useSettings()
  // Re-evaluated whenever cards change; "now" is read inside so counts stay current.
  const stats = useLiveQuery(async () => {
    const now = Date.now()
    const due = await db.cards.where('due').between(1, now, true, true).filter((r) => r.status === 'learning').count()
    const next = await db.cards.where('due').above(now).first()
    const learnedToday = await db.cards
      .where('addedAt')
      .aboveOrEqual(dayStart(now))
      .filter((r) => r.status === 'learning')
      .count()
    return { due, nextIn: next ? next.due - now : null, learnedToday }
  }, [])

  if (!stats) return <section className="screen" />

  return (
    <section className="screen">
      <h1>Today</h1>

      <button className="action-card" onClick={() => navigate('review')} disabled={stats.due === 0}>
        <span className="action-title">Review</span>
        <span className="action-sub">
          {stats.due > 0
            ? `${stats.due} ${stats.due === 1 ? 'word' : 'words'} due`
            : stats.nextIn !== null
              ? `Nothing due · next in ${describeInterval(stats.nextIn)}`
              : 'Nothing to review yet'}
        </span>
      </button>

      <button className="action-card" onClick={() => navigate('learn')}>
        <span className="action-title">Learn new words</span>
        <span className="action-sub">
          {stats.learnedToday} of {settings.dailyNewWords} today
          {stats.learnedToday >= settings.dailyNewWords && ' · goal reached, keep going if you like'}
        </span>
      </button>
    </section>
  )
}
