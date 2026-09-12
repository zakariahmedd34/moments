import type { Day, Moment } from '../types'
import { fromDayKey, toDayKey } from './dates'

// newest day first, moments inside a day from morning to evening; today is always included
export function groupMomentsByDay(moments: Moment[], todayKey: string): Day[] {
  const byKey = new Map<string, Moment[]>()

  for (const moment of moments) {
    const key = toDayKey(new Date(moment.created_at))
    const list = byKey.get(key)
    if (list) {
      list.push(moment)
    } else {
      byKey.set(key, [moment])
    }
  }

  if (!byKey.has(todayKey)) {
    byKey.set(todayKey, [])
  }

  return [...byKey.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, list]) => ({
      key,
      date: fromDayKey(key) ?? new Date(),
      moments: list.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
    }))
}
