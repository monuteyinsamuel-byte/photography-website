import { useState } from 'react'
import { useSignedImageUrls } from '../../hooks/useSignedImageUrls'
import type { PortfolioImageRow } from '../../lib/database.types'
import Lightbox, { type GalleryItem } from './Lightbox'

interface GalleryGridProps {
  images: PortfolioImageRow[]
}

function GalleryGrid({ images }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { urls, error } = useSignedImageUrls(images.map((image) => image.image_path))
  const items = images.flatMap((image) => {
    const src = urls[image.image_path]
    return src
      ? [
          {
            id: image.id,
            src,
            alt: image.alt_text || image.caption || 'Portfolio photograph',
            caption: image.caption,
          },
        ]
      : []
  }) satisfies GalleryItem[]

  return (
    <>
      {error && <p className="inline-error" role="alert">Unable to load portfolio images: {error}</p>}
      <div className="gallery-grid">
        {items.map((item, index) => (
          <button
            className="gallery-item"
            type="button"
            key={item.id}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${item.alt}`}
          >
            <img src={item.src} alt={item.alt} loading="lazy" />
            {item.caption && <span className="gallery-caption">{item.caption}</span>}
          </button>
        ))}
      </div>
      {activeIndex !== null && (
        <Lightbox
          items={items}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChange={setActiveIndex}
        />
      )}
    </>
  )
}

export default GalleryGrid
