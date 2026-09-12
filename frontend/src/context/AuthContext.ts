import { createContext } from 'react'
import type { RegisterInput } from '../services/auth'
import type { User } from '../types'

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut' | 'unavailable'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (input: RegisterInput) => Promise<void>
  signOut: () => void
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
