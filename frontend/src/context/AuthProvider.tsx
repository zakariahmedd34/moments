import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, setUnauthorizedHandler, tokenStore } from '../services/api'
import { fetchCurrentUser, login, register, type RegisterInput } from '../services/auth'
import type { User } from '../types'
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.get() ? 'loading' : 'signedOut'))
  const [user, setUser] = useState<User | null>(null)

  const signOut = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('signedOut')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  useEffect(() => {
    if (status !== 'loading') return
    let cancelled = false

    fetchCurrentUser()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('signedIn')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (!(error instanceof ApiError && error.status === 401)) {
          setStatus('unavailable')
        }
      })

    return () => {
      cancelled = true
    }
  }, [status])

  const signIn = useCallback(async (identifier: string, password: string) => {
    const token = await login(identifier, password)
    tokenStore.set(token)
    const me = await fetchCurrentUser()
    setUser(me)
    setStatus('signedIn')
  }, [])

  const signUp = useCallback(
    async (input: RegisterInput) => {
      await register(input)
      await signIn(input.email, input.password)
    },
    [signIn],
  )

  const retry = useCallback(() => setStatus('loading'), [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signUp, signOut, retry }),
    [status, user, signIn, signUp, signOut, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
