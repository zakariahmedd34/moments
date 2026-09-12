import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../services/api'
import { fetchFeed } from '../services/moments'
import type { Moment } from '../types'

interface FeedState {
  status: 'loading' | 'ready' | 'error'
  moments: Moment[]
  error: string | null
}

export function useFeed() {
  const [state, setState] = useState<FeedState>({ status: 'loading', moments: [], error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchFeed()
      .then((moments) => {
        if (!cancelled) setState({ status: 'ready', moments, error: null })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof ApiError ? error.message : 'Something went wrong. Try again.'
        setState((previous) => ({ status: 'error', moments: previous.moments, error: message }))
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setAttempt((count) => count + 1)
  }, [])

  const removeMoment = useCallback((id: string) => {
    setState((previous) => ({ ...previous, moments: previous.moments.filter((moment) => moment.id !== id) }))
  }, [])

  const addMoment = useCallback((moment: Moment) => {
    setState((previous) => ({
      ...previous,
      moments: [moment, ...previous.moments.filter((existing) => existing.id !== moment.id)],
    }))
  }, [])

  return { ...state, reload, removeMoment, addMoment }
}
