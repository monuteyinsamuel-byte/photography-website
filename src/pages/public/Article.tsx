import { useCallback, useState } from 'react'
import EmptyState from '../../components/shared/EmptyState'
import { useSignedImageUrl } from '../../hooks/useSignedImageUrls'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import { loadArticle } from '../../lib/publicData'
import { formatDate } from '../../utils/formatting'
import PageHeading from '../../components/shared/PageHeading'

interface ArticleProps {
  slug: string
}

function Article({ slug }: ArticleProps) {
  const [shareError, setShareError] = useState('')
  const loader = useCallback(() => loadArticle(slug), [slug])
  const result = useResource(loader)
  const article = result.data
  const { url: cover, error: coverError } = useSignedImageUrl(article?.cover_image_path)
  const canonical = article
    ? `${window.location.origin}${window.location.pathname}#/journal/${encodeURIComponent(article.slug)}`
    : undefined

  usePageMeta(
    article?.title || 'Journal article',
    article?.seo_description || article?.excerpt || 'A photography story from the studio.',
    canonical,
  )

  async function shareArticle() {
    setShareError('')
    try {
      if (navigator.share) {
        await navigator.share({ title: article?.title, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setShareError('Link copied to clipboard.')
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return
      setShareError(
        error instanceof Error ? error.message : 'Unable to share this article.',
      )
    }
  }

  if (result.loading) {
    return (
      <section className="page-section">
        <PageHeading id="article-loading-title" eyebrow="The journal" title="Loading story" />
        <p className="loading-note">Loading article…</p>
      </section>
    )
  }
  if (result.error) {
    return (
      <section className="page-section">
        <PageHeading id="article-error-title" eyebrow="The journal" title="Article unavailable" />
        <EmptyState title="Article unavailable" error={result.error} />
      </section>
    )
  }
  if (!article) {
    return (
      <section className="page-section">
        <PageHeading id="article-missing-title" eyebrow="The journal" title="Story not found" />
        <EmptyState
          title="This story is not available"
          message="It may have been unpublished or moved."
        />
      </section>
    )
  }

  return (
    <article className="page-section article-page">
      <a className="back-link" href="#/journal">← Back to journal</a>
      <header className="article-header">
        {article.category && <p className="eyebrow">{article.category}</p>}
        <h1>{article.title}</h1>
        {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
        {article.publication_date && (
          <p className="article-date">{formatDate(article.publication_date)}</p>
        )}
      </header>
      {cover && <img className="article-cover" src={cover} alt="" />}
      {coverError && <p className="inline-error" role="alert">Unable to load the article cover: {coverError}</p>}
      <div className="article-content">
        {article.content.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <div className="article-share">
        <button className="text-link" type="button" onClick={shareArticle}>
          Share this story <span aria-hidden="true">↗</span>
        </button>
        {shareError && <p role="status">{shareError}</p>}
      </div>
    </article>
  )
}

export default Article
