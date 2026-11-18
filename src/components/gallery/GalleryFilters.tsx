import type { GalleryCategoryRow } from '../../lib/database.types'

interface GalleryFiltersProps {
  categories: GalleryCategoryRow[]
  selected: string
  onChange: (categoryId: string) => void
}

function GalleryFilters({
  categories,
  selected,
  onChange,
}: GalleryFiltersProps) {
  return (
    <div className="gallery-filters" aria-label="Filter portfolio by category">
      <button
        className={selected === '' ? 'filter-chip is-active' : 'filter-chip'}
        type="button"
        aria-pressed={selected === ''}
        onClick={() => onChange('')}
      >
        All work
      </button>
      {categories.map((category) => (
        <button
          className={
            selected === category.id ? 'filter-chip is-active' : 'filter-chip'
          }
          key={category.id}
          type="button"
          aria-pressed={selected === category.id}
          onClick={() => onChange(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

export default GalleryFilters
