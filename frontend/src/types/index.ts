export interface User {
  id: string
  email: string
  username: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
}

export interface Moment {
  id: string
  user_id: string
  username: string
  caption: string | null
  url: string
  file_type: string
  file_name: string
  created_at: string
  is_owner: boolean
}

export interface Day {
  key: string
  date: Date
  moments: Moment[]
}

export type JournalScope = 'everyone' | 'mine' | 'user'

export interface JournalOwner {
  username: string
  momentCount: number
  dayCount: number
}
