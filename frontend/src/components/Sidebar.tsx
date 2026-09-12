import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { JournalOwner, JournalScope } from '../types'
import { formatMomentCount } from '../utils/dates'
import { Avatar } from './Avatar'
import { ChevronLeftIcon } from './icons'
import { SegmentedControl } from './SegmentedControl'

const SCOPE_OPTIONS: { value: JournalScope; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'mine', label: 'Mine' },
]

interface SidebarProps {
  scope: JournalScope
  owner: JournalOwner | null
  onScopeChange: (scope: JournalScope) => void
  onCapture: () => void
  children: ReactNode
}

export function Sidebar({ scope, owner, onScopeChange, onCapture, children }: SidebarProps) {
  const { user, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <Link to="/" className="sidebar__brand">
          moments
        </Link>
        <button type="button" className="btn btn--primary btn--small" onClick={onCapture}>
          <span className="btn__plus" aria-hidden="true">
            +
          </span>
          Capture
        </button>
      </div>

      {scope === 'user' && owner ? (
        <div className="profile-head">
          <Link to="/" className="profile-head__back">
            <ChevronLeftIcon />
            Everyone
          </Link>
          <div className="profile-head__row">
            <Avatar username={owner.username} size={48} />
            <div className="profile-head__text">
              <h2 className="profile-head__name">@{owner.username}</h2>
              <p className="profile-head__stats">
                {formatMomentCount(owner.momentCount)} · {owner.dayCount} {owner.dayCount === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <SegmentedControl label="Show moments from" options={SCOPE_OPTIONS} value={scope} onChange={onScopeChange} />
      )}

      <div className="sidebar__days">{children}</div>

      {user && (
        <div className="account">
          <Link to="/mine" className="account__profile" aria-label={`Your journal, @${user.username}`}>
            <Avatar username={user.username} size={36} />
            <span className="account__text">
              <span className="account__name">@{user.username}</span>
              <span className="account__email">{user.email}</span>
            </span>
          </Link>
          <button type="button" className="btn btn--secondary account__signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </aside>
  )
}
