import type { ReactNode } from 'react'

interface StatusScreenProps {
  title?: string
  text?: string
  children?: ReactNode
  busy?: boolean
}

export function StatusScreen({ title, text, children, busy = false }: StatusScreenProps) {
  return (
    <main className="status-screen" aria-busy={busy}>
      <p className="status-screen__brand">moments</p>
      {title && <h1 className="status-screen__title">{title}</h1>}
      {text && <p className="status-screen__text">{text}</p>}
      {children}
    </main>
  )
}
