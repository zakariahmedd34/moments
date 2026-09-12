import type { Moment } from '../types'
import { imageUrl } from '../utils/images'

export function PhotoStack({ moments }: { moments: Moment[] }) {
  const photos = moments.filter((moment) => moment.file_type !== 'video').slice(-3)

  if (photos.length === 0) {
    return <span className="photo-stack photo-stack--empty" aria-hidden="true" />
  }

  return (
    <span className="photo-stack" aria-hidden="true">
      {photos.map((moment, index) => (
        <img
          key={moment.id}
          className="photo-stack__photo"
          data-layer={photos.length - 1 - index}
          src={imageUrl(moment.url, 120)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden'
          }}
        />
      ))}
    </span>
  )
}
