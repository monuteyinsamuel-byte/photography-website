import { useCallback, useState } from 'react'
import EmptyState from '../../components/shared/EmptyState'
import PageHeading from '../../components/shared/PageHeading'
import SignedImage from '../../components/shared/SignedImage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import { loadArticles } from '../../lib/publicData'
import { formatDate } from '../../utils/formatting'

function Journal() {
  const [category, setCategory] = useState('')
  const loader = useCallback(() => loadArticles(), [])
  const result = useResource(loader)
  const articles = result.data ?? []
  const categories = [...new Set(articles.flatMap((article) => article.category ? [article.category] : []))]
  const visibleArticles = category
    ? articles.filter((article) => article.category === category)
    : articles
  usePageMeta('Journal', 'Published photography stories and articles from the studio.')

  return (
    <section className="page-section" aria-labelledby="journal-title">
      <PageHeading
        id="journal-title"
        eyebrow="The journal"
        title="Notes & stories"
        description="Stories, perspectives, and moments from behind the camera."
      />
      {result.loading && <p className="loading-note">Loading published stories…</p>}
      {result.error && <p className="inline-error" role="alert">{result.error}</p>}
      {categories.length > 0 && (
        <div className="gallery-filters" aria-label="Filter journal by category">
          <button
            className={category === '' ? 'filter-chip is-active' : 'filter-chip'}
            type="button"
            aria-pressed={category === ''}
            onClick={() => setCategory('')}
          >
            All stories
          </button>
          {categories.map((name) => (
            <button
              className={category === name ? 'filter-chip is-active' : 'filter-chip'}
              type="button"
              aria-pressed={category === name}
              key={name}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {visibleArticles.length ? (
        <div className="article-grid journal-grid">
          {visibleArticles.map((article) => {
            return (
              <a
                className="article-card"
                href={`#/journal/${encodeURIComponent(article.slug)}`}
                key={article.id}
              >
                <SignedImage path={article.cover_image_path} alt="" />
                <span className="article-date">
                  {article.category && `${article.category} · `}
                  {formatDate(article.publication_date)}
                </span>
                <h2>{article.title}</h2>
                {article.excerpt && <p>{article.excerpt}</p>}
                <span className="article-read-link">
                  Read story <span aria-hidden="true">↗</span>
                </span>
              </a>
            )
          })}
        </div>
      ) : !result.loading && !result.error ? (
        <EmptyState
          title={category ? 'No stories in this category' : 'No journal articles have been published'}
          message={category ? 'Choose another category to see published stories.' : 'Published stories will appear here.'}
        />
      ) : null}
    </section>
  )
}

export default Journal
