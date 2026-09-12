import { Link } from 'react-router-dom'
import type { Day } from '../types'
import { formatDaySubtitle, formatDayTitle, formatMomentCount } from '../utils/dates'
import { PhotoStack } from './PhotoStack'

interface DayListProps {
  days: Day[]
  selectedKey: string
  now: Date
  hrefFor: (key: string) => string
}

export function DayList({ days, selectedKey, now, hrefFor }: DayListProps) {
  return (
    <nav aria-label="Days">
      <ul className="day-list">
        {days.map((day) => (
          <li key={day.key}>
            <Link
              to={hrefFor(day.key)}
              className="day-item"
              aria-current={day.key === selectedKey ? 'page' : undefined}
            >
              <PhotoStack moments={day.moments} />
              <span className="day-item__text">
                <span className="day-item__title">{formatDayTitle(day.date, now)}</span>
                <span className="day-item__meta">
                  {formatDaySubtitle(day.date, now)} ·{' '}
                  <span className="day-item__count">
                    {day.moments.length === 0 ? 'no moments yet' : formatMomentCount(day.moments.length)}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
