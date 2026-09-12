import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  text?: string | null
  children?: ReactNode
}

export function EmptyState({ title, text, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true" />
      <h2 className="empty-state__title">{title}</h2>
      {text && <p className="empty-state__text">{text}</p>}
      {children}
    </div>
  )
}
