import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CaptureDiary } from '../components/CaptureDiary'
import { DayList } from '../components/DayList'
import { DayView } from '../components/DayView'
import { EmptyState } from '../components/EmptyState'
import { MomentDiary } from '../components/MomentDiary'
import { Sidebar } from '../components/Sidebar'
import { DayListSkeleton, DayViewSkeleton } from '../components/Skeletons'
import { useAuth } from '../hooks/useAuth'
import { useFeed } from '../hooks/useFeed'
import type { Day, JournalOwner, JournalScope, Moment } from '../types'
import { fromDayKey, toDayKey } from '../utils/dates'
import { groupMomentsByDay } from '../utils/days'
import '../styles/journal.css'

function basePath(scope: JournalScope, username: string | null): string {
  if (scope === 'mine') return '/mine'
  if (scope === 'user') return `/u/${username}`
  return ''
}

export default function JournalPage({ scope }: { scope: JournalScope }) {
  const { dayKey, username: rawUsername } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const feed = useFeed()
  const [capturing, setCapturing] = useState(false)

  const ownerName = scope === 'user' && rawUsername ? rawUsername.toLowerCase() : null
  const now = new Date()
  const todayKey = toDayKey(now)

  const days = useMemo(() => {
    let visible = feed.moments
    if (scope === 'mine') visible = feed.moments.filter((moment) => moment.is_owner)
    if (scope === 'user') visible = feed.moments.filter((moment) => moment.username === ownerName)
    return groupMomentsByDay(visible, todayKey)
  }, [feed.moments, scope, ownerName, todayKey])

  const base = basePath(scope, ownerName)
  const homeHref = base || '/'
  const requestedDate = dayKey ? fromDayKey(dayKey) : null

  // /u/<me> is the same as /mine, and usernames are always lowercase
  if (scope === 'user' && ownerName && (ownerName === user?.username || ownerName !== rawUsername)) {
    const target = ownerName === user?.username ? '/mine' : `/u/${ownerName}`
    return <Navigate to={dayKey ? `${target}/day/${dayKey}` : target} replace />
  }

  if (dayKey && !requestedDate) {
    return <Navigate to={homeHref} replace />
  }

  const selectedKey = dayKey ?? days[0].key
  const selectedDay: Day = days.find((day) => day.key === selectedKey) ?? {
    key: selectedKey,
    date: requestedDate ?? now,
    moments: [],
  }

  const owner: JournalOwner | null =
    ownerName && feed.status === 'ready'
      ? {
          username: ownerName,
          momentCount: days.reduce((total, day) => total + day.moments.length, 0),
          dayCount: days.filter((day) => day.moments.length > 0).length,
        }
      : ownerName
        ? { username: ownerName, momentCount: 0, dayCount: 0 }
        : null

  const openId = searchParams.get('moment')
  const openDay = openId ? days.find((day) => day.moments.some((moment) => moment.id === openId)) : undefined
  const openIndex = openDay ? openDay.moments.findIndex((moment) => moment.id === openId) : -1
  const openedFromCard = Boolean((location.state as { openedFromCard?: boolean } | null)?.openedFromCard)

  function changeScope(next: JournalScope) {
    const nextBase = basePath(next, null)
    navigate(dayKey ? `${nextBase}/day/${dayKey}` : nextBase || '/')
  }

  function showMoment(id: string) {
    setSearchParams({ moment: id }, { replace: true, state: location.state })
  }

  function closeMoment() {
    // opening from a card added a history entry, so going back keeps Back/Forward natural
    if (openedFromCard) {
      navigate(-1)
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  function handleDeleted(id: string) {
    const remaining = openDay ? openDay.moments.filter((moment) => moment.id !== id) : []
    feed.removeMoment(id)
    if (remaining.length === 0) {
      closeMoment()
    } else {
      showMoment(remaining[Math.min(openIndex, remaining.length - 1)].id)
    }
  }

  function openCapture() {
    setCapturing(true)
  }

  function handleSaved(moment: Moment) {
    feed.addMoment(moment)
    setCapturing(false)
    const savedBase = scope === 'user' ? '/mine' : base
    navigate(`${savedBase}/day/${toDayKey(new Date(moment.created_at))}`)
  }

  const feedError = (
    <EmptyState title="Couldn't load moments" text={feed.error}>
      <button type="button" className="btn btn--secondary" onClick={feed.reload}>
        Try again
      </button>
    </EmptyState>
  )

  return (
    <div className="journal" data-view={dayKey ? 'day' : 'list'}>
      <Sidebar scope={scope} owner={owner} onScopeChange={changeScope} onCapture={openCapture}>
        {feed.status === 'loading' && <DayListSkeleton />}
        {feed.status === 'error' && <div className="sidebar__error">{feedError}</div>}
        {feed.status === 'ready' && (
          <DayList days={days} selectedKey={selectedKey} now={now} hrefFor={(key) => `${base}/day/${key}`} />
        )}
      </Sidebar>

      <main className="journal__pane">
        {feed.status === 'loading' && <DayViewSkeleton />}
        {feed.status === 'error' && (
          <section className="day-view">
            <div className="day-view__body">{feedError}</div>
          </section>
        )}
        {feed.status === 'ready' && (
          <DayView
            day={selectedDay}
            now={now}
            scope={scope}
            ownerName={ownerName}
            homeHref={homeHref}
            onCapture={openCapture}
          />
        )}
      </main>

      {feed.status === 'ready' && openDay && (
        <MomentDiary
          moment={openDay.moments[openIndex]}
          position={openIndex + 1}
          total={openDay.moments.length}
          now={now}
          onPrevious={openIndex > 0 ? () => showMoment(openDay.moments[openIndex - 1].id) : null}
          onNext={openIndex < openDay.moments.length - 1 ? () => showMoment(openDay.moments[openIndex + 1].id) : null}
          onClose={closeMoment}
          onDeleted={handleDeleted}
        />
      )}

      {capturing && <CaptureDiary onClose={() => setCapturing(false)} onSaved={handleSaved} />}
    </div>
  )
}
