import type { Moment } from '../types'
import { apiRequest } from './api'

export async function fetchFeed(): Promise<Moment[]> {
  const result = await apiRequest<{ posts: Moment[] }>('/feed')
  return result.posts
}

export function createMoment(photo: File, caption: string): Promise<Moment> {
  const body = new FormData()
  body.append('file', photo)
  body.append('caption', caption)
  return apiRequest<Moment>('/upload', { method: 'POST', body })
}

export async function deleteMoment(id: string): Promise<void> {
  await apiRequest(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
