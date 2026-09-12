import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../services/api'
import { deleteMoment } from '../services/moments'
import type { Moment } from '../types'
import { formatDayEyebrow, formatTime } from '../utils/dates'
import { imageUrl } from '../utils/images'
import { Avatar } from './Avatar'
import { ConfirmDialog } from './ConfirmDialog'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, TrashIcon } from './icons'
import '../styles/diary.css'

interface MomentDiaryProps {
  moment: Moment
  position: number
  total: number
  now: Date
  onPrevious: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
  onDeleted: (id: string) => void
}

export function MomentDiary({ moment, position, total, now, onPrevious, onNext, onClose, onDeleted }: MomentDiaryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const created = new Date(moment.created_at)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (confirming) return
    if (event.key === 'ArrowLeft' && onPrevious) {
      event.preventDefault()
      onPrevious()
    } else if (event.key === 'ArrowRight' && onNext) {
      event.preventDefault()
      onNext()
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteMoment(moment.id)
      setConfirming(false)
      setDeleting(false)
      onDeleted(moment.id)
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Couldn't delete this moment. Try again.")
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="diary"
      aria-labelledby="diary-title"
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault()
        if (!confirming) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="diary__spread">
        <DiaryMedia key={moment.id} moment={moment} />

        <div className="diary__page">
          <div key={`${moment.id}-when`} className="diary__when">
            <p className="eyebrow">{formatDayEyebrow(created, now)}</p>
            <h2 id="diary-title" className="diary__time">
              <time dateTime={moment.created_at}>{formatTime(created)}</time>
            </h2>
          </div>

          <div className="diary__thought-wrap">
            {moment.caption ? (
              <p key={`${moment.id}-thought`} className="diary__thought">
                {moment.caption}
              </p>
            ) : (
              <p key={`${moment.id}-thought`} className="diary__thought diary__thought--empty">
                No words, just the photo.
              </p>
            )}
          </div>

          <footer className="diary__footer">
            <Link to={`/u/${moment.username}`} className="diary__author">
              <Avatar username={moment.username} size={32} />
              <span>@{moment.username}</span>
            </Link>
            {total > 1 && (
              <div className="diary__pager">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Previous moment"
                  disabled={!onPrevious}
                  onClick={onPrevious ?? undefined}
                >
                  <ChevronLeftIcon />
                </button>
                <span aria-live="polite">
                  {position} of {total}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Next moment"
                  disabled={!onNext}
                  onClick={onNext ?? undefined}
                >
                  <ChevronRightIcon />
                </button>
              </div>
            )}
          </footer>
        </div>

        <div className="diary__actions">
          {moment.is_owner && (
            <button
              type="button"
              className="icon-button icon-button--danger"
              aria-label="Delete moment"
              onClick={() => {
                setDeleteError(null)
                setConfirming(true)
              }}
            >
              <TrashIcon />
            </button>
          )}
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this moment?"
        text="It will be removed from your journal and from everyone's feed. This can't be undone."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </dialog>
  )
}

function DiaryMedia({ moment }: { moment: Moment }) {
  const [failed, setFailed] = useState(false)
  const isVideo = moment.file_type === 'video'

  return (
    <div className="diary__media">
      {!failed && !isVideo && (
        <img className="diary__media-blur" src={imageUrl(moment.url, 400)} alt="" aria-hidden="true" />
      )}
      {failed ? (
        <p className="diary__missing">{isVideo ? 'Video unavailable' : 'Photo unavailable'}</p>
      ) : isVideo ? (
        <video className="diary__media-main" src={moment.url} controls playsInline onError={() => setFailed(true)} />
      ) : (
        <img
          className="diary__media-main"
          src={imageUrl(moment.url, 1600)}
          alt={`Photo by @${moment.username}`}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
