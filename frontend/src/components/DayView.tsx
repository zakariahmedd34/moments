import { Link } from 'react-router-dom'
import type { Day, JournalScope } from '../types'
import { formatDayEyebrow, formatDayTitle, formatMomentCount, toDayKey } from '../utils/dates'
import { EmptyState } from './EmptyState'
import { MomentCard } from './MomentCard'

interface DayViewProps {
  day: Day
  now: Date
  scope: JournalScope
  ownerName: string | null
  homeHref: string
  onCapture: () => void
}

function emptyCopy(scope: JournalScope, isToday: boolean, ownerName: string | null) {
  if (scope === 'user') {
    return isToday
      ? { title: `Nothing from @${ownerName} today`, text: 'Look through their other days.' }
      : { title: 'No moments on this day', text: `@${ownerName} didn't capture anything on this day.` }
  }
  if (isToday) {
    return scope === 'mine'
      ? { title: 'Nothing captured today', text: 'Save a photo and a few words about your day.' }
      : { title: 'No moments yet today', text: 'Be the first to capture a moment today.' }
  }
  return {
    title: 'No moments on this day',
    text: scope === 'mine' ? "You didn't capture anything on this day." : 'Nobody captured a moment on this day.',
  }
}

export function DayView({ day, now, scope, ownerName, homeHref, onCapture }: DayViewProps) {
  const isToday = day.key === toDayKey(now)
  const count = day.moments.length
  const empty = emptyCopy(scope, isToday, ownerName)
  const eyebrow = formatDayEyebrow(day.date, now)

  return (
    <section className="day-view" aria-labelledby="day-view-title">
      <header className="day-view__header">
        <Link to={homeHref} className="day-view__back" aria-label="All days">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="day-view__heading">
          <p className="eyebrow">{scope === 'user' && ownerName ? `@${ownerName} · ${eyebrow}` : eyebrow}</p>
          <h1 id="day-view-title" className="day-view__title">
            {formatDayTitle(day.date, now)}
          </h1>
        </div>
        {count > 0 && <span className="day-view__count">{formatMomentCount(count)}</span>}
      </header>

      <div className="day-view__body">
        {count === 0 ? (
          <EmptyState title={empty.title} text={empty.text}>
            {isToday && scope !== 'user' && (
              <button type="button" className="btn btn--primary" onClick={onCapture}>
                Capture a moment
              </button>
            )}
            {!isToday && (
              <Link to={homeHref} className="btn btn--secondary">
                {scope === 'user' ? `Latest from @${ownerName}` : 'Go to today'}
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="moment-grid">
            {day.moments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} to={{ search: `?moment=${moment.id}` }} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
