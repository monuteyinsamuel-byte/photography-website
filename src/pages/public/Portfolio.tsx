import { useEffect, useState } from 'react'
import GalleryFilters from '../../components/gallery/GalleryFilters'
import GalleryGrid from '../../components/gallery/GalleryGrid'
import EmptyState from '../../components/shared/EmptyState'
import PageHeading from '../../components/shared/PageHeading'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import {
  loadCategories,
  loadPortfolioPage,
  PORTFOLIO_PAGE_SIZE,
} from '../../lib/publicData'
import type { PortfolioImageRow } from '../../lib/database.types'

function Portfolio() {
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState<Record<string, {
    images: PortfolioImageRow[]
    error: string | null
  }>>({})
  const categories = useResource(loadCategories)
  const pageKey = `${categoryId}:${page}`
  const loadedPage = pages[pageKey]
  const loading = !loadedPage
  const imageError = loadedPage?.error || ''
  const images = Array.from({ length: page + 1 }, (_, index) =>
    pages[`${categoryId}:${index}`]?.images ?? [],
  ).flat()
  const hasMore =
    loadedPage?.images.length === PORTFOLIO_PAGE_SIZE && !loadedPage.error

  usePageMeta('Portfolio', 'Selected published photography from the studio.')

  useEffect(() => {
    let active = true
    loadPortfolioPage(page, categoryId || undefined).then(
      (result) => {
        if (!active) return
        setPages((current) => ({
          ...current,
          [pageKey]: {
            images: result.data ?? [],
            error: result.error,
          },
        }))
      },
      (error: unknown) => {
        if (!active) return
        setPages((current) => ({
          ...current,
          [pageKey]: {
            images: [],
            error:
              error instanceof Error
                ? error.message
                : 'Unable to load portfolio images.',
          },
        }))
      },
    )
    return () => {
      active = false
    }
  }, [page, categoryId, pageKey])

  function changeCategory(value: string) {
    setCategoryId(value)
    setPage(0)
  }

  return (
    <section className="page-section" aria-labelledby="portfolio-title">
      <PageHeading
        id="portfolio-title"
        eyebrow="The portfolio"
        title="Selected moments"
        description="A collection of published work from the photographer."
      />
      {categories.data && (
        <GalleryFilters
          categories={categories.data}
          selected={categoryId}
          onChange={changeCategory}
        />
      )}
      {categories.error && (
        <p className="inline-error" role="alert">{categories.error}</p>
      )}
      {loading && (
        <p className="loading-note">Loading published photographs…</p>
      )}
      {imageError && <p className="inline-error" role="alert">{imageError}</p>}
      {!loading && !imageError && images.length === 0 && (
        <EmptyState
          title="No photographs in this collection yet"
          message="Published portfolio photographs will appear here."
        />
      )}
      {images.length > 0 && <GalleryGrid images={images} />}
      {images.length > 0 && hasMore && (
        <button
          className="button-link load-more"
          type="button"
          disabled={loading}
          onClick={() => setPage((current) => current + 1)}
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </section>
  )
}

export default Portfolio
