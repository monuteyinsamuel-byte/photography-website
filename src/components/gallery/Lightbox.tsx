import { useEffect } from 'react'

export interface GalleryItem {
  id: string
  src: string
  alt: string
  caption: string | null
}

interface LightboxProps {
  items: GalleryItem[]
  index: number
  onClose: () => void
  onChange: (index: number) => void
}

function Lightbox({ items, index, onClose, onChange }: LightboxProps) {
  const item = items[index]

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onChange((index - 1 + items.length) % items.length)
      if (event.key === 'ArrowRight') onChange((index + 1) % items.length)
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [index, items.length, onChange, onClose])

  if (!item) return null

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio image preview"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button className="lightbox-close" type="button" onClick={onClose} aria-label="Close preview">
        ×
      </button>
      {items.length > 1 && (
        <>
          <button
            className="lightbox-arrow lightbox-prev"
            type="button"
            aria-label="Previous image"
            onClick={() => onChange((index - 1 + items.length) % items.length)}
          >
            ←
          </button>
          <button
            className="lightbox-arrow lightbox-next"
            type="button"
            aria-label="Next image"
            onClick={() => onChange((index + 1) % items.length)}
          >
            →
          </button>
        </>
      )}
      <figure className="lightbox-figure">
        <img src={item.src} alt={item.alt} />
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
    </div>
  )
}

export default Lightbox
