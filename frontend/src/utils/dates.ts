const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
const dayMonthFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

const MS_PER_DAY = 86_400_000

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDayKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return toDayKey(date) === key ? date : null
}

function daysAgo(date: Date, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((today.getTime() - day.getTime()) / MS_PER_DAY)
}

function formatDayMonth(date: Date, now: Date): string {
  const text = dayMonthFormat.format(date)
  return date.getFullYear() === now.getFullYear() ? text : `${text} ${date.getFullYear()}`
}

// "Today", "Yesterday", "Thursday", or "3 September"
export function formatDayTitle(date: Date, now: Date): string {
  const ago = daysAgo(date, now)
  if (ago === 0) return 'Today'
  if (ago === 1) return 'Yesterday'
  if (ago > 1 && ago < 7) return weekdayFormat.format(date)
  return formatDayMonth(date, now)
}

// "Saturday 12 September"
export function formatDayEyebrow(date: Date, now: Date): string {
  return `${weekdayFormat.format(date)} ${formatDayMonth(date, now)}`
}

// the part of the date the title doesn't already say
export function formatDaySubtitle(date: Date, now: Date): string {
  const ago = daysAgo(date, now)
  if (ago === 0 || ago === 1) return `${weekdayFormat.format(date)} ${date.getDate()}`
  if (ago > 1 && ago < 7) return formatDayMonth(date, now)
  return weekdayFormat.format(date)
}

export function formatTime(date: Date): string {
  return timeFormat.format(date)
}

export function formatMomentCount(count: number): string {
  return `${count} ${count === 1 ? 'moment' : 'moments'}`
}
