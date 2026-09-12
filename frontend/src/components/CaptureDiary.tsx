import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { ApiError } from '../services/api'
import { createMoment } from '../services/moments'
import type { Moment } from '../types'
import { formatDayEyebrow, formatTime } from '../utils/dates'
import { prepareImage } from '../utils/prepareImage'
import { ConfirmDialog } from './ConfirmDialog'
import { CloseIcon, PhotoIcon } from './icons'
import '../styles/diary.css'

const MAX_CAPTION = 280
const SHOW_COUNT_FROM = MAX_CAPTION - 40
const MAX_FILE_BYTES = 50 * 1024 * 1024

interface CaptureDiaryProps {
  onClose: () => void
  onSaved: (moment: Moment) => void
}

export function CaptureDiary({ onClose, onSaved }: CaptureDiaryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [openedAt] = useState(() => new Date())
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [caption, setCaption] = useState('')
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function chooseFile(next: File | undefined) {
    if (!next || saving) return
    if (!next.type.startsWith('image/')) {
      setError('Choose a photo file, like JPG, PNG or HEIC.')
      return
    }
    if (next.size > MAX_FILE_BYTES) {
      setError('This photo is too large. Choose one under 50 MB.')
      return
    }
    setError(null)
    setPreviewFailed(false)
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function requestClose() {
    if (saving) return
    if (file || caption.trim()) {
      setConfirmingDiscard(true)
    } else {
      onClose()
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!saving) setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    chooseFile(event.dataTransfer.files[0])
  }

  function handlePaste(event: ClipboardEvent<HTMLDialogElement>) {
    const image = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/'))
    if (image) {
      event.preventDefault()
      chooseFile(image)
    }
  }

  function handleCaptionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || saving) return
    setSaving(true)
    setError(null)
    try {
      const photo = await prepareImage(file)
      const moment = await createMoment(photo, caption.trim())
      onSaved(moment)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your moment couldn't be saved. Try again.")
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="diary capture"
      aria-labelledby="capture-title"
      onPaste={handlePaste}
      onCancel={(event) => {
        event.preventDefault()
        if (!confirmingDiscard) requestClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <form className="diary__spread" onSubmit={handleSubmit}>
        <div
          className={`diary__media capture__media${dragging ? ' capture__media--dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {previewUrl && !previewFailed ? (
            <>
              <img className="diary__media-blur" src={previewUrl} alt="" aria-hidden="true" />
              <img
                className="diary__media-main"
                src={previewUrl}
                alt="Your chosen photo"
                onError={() => setPreviewFailed(true)}
              />
            </>
          ) : file ? (
            <p className="capture__no-preview">
              This photo can't be previewed here, but it will still be saved.
              <span>{file.name}</span>
            </p>
          ) : (
            <button type="button" className="capture__drop" onClick={openFilePicker} disabled={saving}>
              <span className="capture__drop-icon">
                <PhotoIcon />
              </span>
              <span className="capture__drop-title">Add a photo</span>
              <span className="capture__drop-text">Drag it here, paste it, or click to choose</span>
            </button>
          )}

          {file && (
            <button type="button" className="capture__change" onClick={openFilePicker} disabled={saving}>
              Change photo
            </button>
          )}

          <input
            ref={fileInputRef}
            id="capture-file"
            type="file"
            accept="image/*"
            className="visually-hidden"
            tabIndex={-1}
            onChange={(event) => {
              chooseFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          {dragging && (
            <div className="capture__drop-overlay" aria-hidden="true">
              Drop to add
            </div>
          )}
        </div>

        <div className="diary__page">
          <div className="diary__when">
            <p className="eyebrow">{formatDayEyebrow(openedAt, openedAt)}</p>
            <h2 id="capture-title" className="diary__time">
              Now · {formatTime(openedAt)}
            </h2>
          </div>

          <div className="diary__thought-wrap capture__thought-wrap">
            <label htmlFor="capture-caption" className="visually-hidden">
              What happened in this moment?
            </label>
            <textarea
              id="capture-caption"
              className="capture__textarea"
              placeholder="What happened in this moment?"
              maxLength={MAX_CAPTION}
              value={caption}
              disabled={saving}
              onChange={(event) => setCaption(event.target.value)}
              onKeyDown={handleCaptionKeyDown}
            />
            {caption.length >= SHOW_COUNT_FROM && (
              <span className="capture__count" data-full={caption.length >= MAX_CAPTION}>
                {MAX_CAPTION - caption.length}
              </span>
            )}
          </div>

          <div className="capture__bottom">
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <footer className="diary__footer">
              <span className="capture__visibility">Everyone can see this</span>
              <div className="capture__buttons">
                <button type="button" className="btn btn--plain" onClick={requestClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={!file || saving}>
                  {saving ? 'Saving…' : 'Save moment'}
                </button>
              </div>
            </footer>
          </div>
        </div>

        <div className="diary__actions">
          <button type="button" className="icon-button" aria-label="Close" onClick={requestClose} disabled={saving}>
            <CloseIcon />
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmingDiscard}
        title="Discard this moment?"
        text="Your photo and words won't be saved."
        confirmLabel="Discard"
        busyLabel="Discarding…"
        onConfirm={onClose}
        onCancel={() => setConfirmingDiscard(false)}
      />
    </dialog>
  )
}
