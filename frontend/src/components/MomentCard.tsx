import { useState } from 'react'
import { Link, type To } from 'react-router-dom'
import type { Moment } from '../types'
import { formatTime } from '../utils/dates'
import { imageUrl } from '../utils/images'
import { Avatar } from './Avatar'

interface MomentCardProps {
  moment: Moment
  to: To
}

function openLabel(moment: Moment, time: string): string {
  const caption = moment.caption ? `: ${moment.caption.slice(0, 80)}` : ''
  return `Open moment by @${moment.username} at ${time}${caption}`
}

export function MomentCard({ moment, to }: MomentCardProps) {
  const [mediaFailed, setMediaFailed] = useState(false)
  const isVideo = moment.file_type === 'video'
  const time = formatTime(new Date(moment.created_at))

  return (
    <article className="moment-card">
      <div className="moment-card__media">
        {mediaFailed ? (
          <div className="moment-card__missing">{isVideo ? 'Video unavailable' : 'Photo unavailable'}</div>
        ) : isVideo ? (
          <video src={moment.url} muted playsInline preload="metadata" onError={() => setMediaFailed(true)} />
        ) : (
          <img
            src={imageUrl(moment.url, 900)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setMediaFailed(true)}
          />
        )}
      </div>
      <div className="moment-card__body">
        <div className="moment-card__who">
          <Link to={`/u/${moment.username}`} className="moment-card__author">
            <Avatar username={moment.username} size={28} />
            <span className="moment-card__name">@{moment.username}</span>
          </Link>
          <time className="moment-card__time" dateTime={moment.created_at}>
            {time}
          </time>
        </div>
        {moment.caption && <p className="moment-card__caption">{moment.caption}</p>}
      </div>
      {/* covers the whole card; the author link sits above it */}
      <Link
        to={to}
        state={{ openedFromCard: true }}
        className="moment-card__open"
        aria-label={openLabel(moment, time)}
      />
    </article>
  )
}
