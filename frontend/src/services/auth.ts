import type { User } from '../types'
import { apiRequest } from './api'

export async function login(identifier: string, password: string): Promise<string> {
  const body = new URLSearchParams({ username: identifier, password })
  const result = await apiRequest<{ access_token: string }>('/auth/jwt/login', {
    method: 'POST',
    body,
    auth: false,
  })
  return result.access_token
}

export interface RegisterInput {
  email: string
  username: string
  password: string
}

export function register(input: RegisterInput): Promise<User> {
  return apiRequest<User>('/auth/register', { method: 'POST', json: input, auth: false })
}

export function fetchCurrentUser(): Promise<User> {
  return apiRequest<User>('/users/me')
}
