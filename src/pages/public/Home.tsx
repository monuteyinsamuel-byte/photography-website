import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import {
  loadHomeContent,
  type Resource,
} from '../../lib/publicData'
import { useSignedImageUrls } from '../../hooks/useSignedImageUrls'
import type {
  JournalArticleRow,
  PortfolioImageRow,
  ServiceRow,
  SiteSettingsRow,
  TestimonialRow,
} from '../../lib/database.types'
import EmptyState from '../../components/shared/EmptyState'
import { formatDate, formatPrice } from '../../utils/formatting'

interface HomeContent {
  settings: Resource<SiteSettingsRow>
  images: Resource<PortfolioImageRow[]>
  services: Resource<ServiceRow[]>
  testimonials: Resource<TestimonialRow[]>
  articles: Resource<JournalArticleRow[]>
}

function Home() {
  const { data: content, loading, error } = useResource<HomeContent>(loadHomeContent)
  const settings = content?.settings.data
  const title =
    settings?.homepage_headline || settings?.tagline || 'A quieter way to see the world.'
  const intro = settings?.homepage_text || settings?.introduction
  const images = content?.images.data?.slice(0, 3) ?? []
  const services = content?.services.data ?? []
  const testimonials = content?.testimonials.data ?? []
  const articles = content?.articles.data ?? []
  const { urls, error: imageError } = useSignedImageUrls([
    settings?.hero_image_path,
    ...images.map((image) => image.image_path),
    ...articles.map((article) => article.cover_image_path),
  ])
  const heroPhoto = settings?.hero_image_path ? urls[settings.hero_image_path] : null
  const canonical = settings?.canonical_url
  usePageMeta(
    settings?.website_title || settings?.business_name || 'Photography',
    settings?.website_description || intro || 'Photography and stories from an independent studio.',
    canonical,
  )
  return (
    <>
      <section
        className={heroPhoto ? 'hero-section has-hero-image' : 'hero-section'}
        id="home"
        aria-labelledby="hero-title"
        style={heroPhoto ? { backgroundImage: `linear-gradient(90deg, #11110f 0%, rgb(17 17 15 / 78%) 46%, rgb(17 17 15 / 18%) 100%), url("${heroPhoto}")` } : undefined}
      >
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" />
            {settings?.business_name || 'Independent photography studio'}
          </p>
          <h1 id="hero-title">{title}</h1>
          <p className="hero-description">
            {intro || 'Thoughtful photography for the stories you want to remember.'}
          </p>
          <a className="text-link" href="#/portfolio">
            Discover the work <span aria-hidden="true">↘</span>
          </a>
        </div>

        {!heroPhoto && (
          <div className="hero-art" aria-hidden="true">
            <div className="art-frame">
              <div className="art-orbit art-orbit-one" />
              <div className="art-orbit art-orbit-two" />
              <div className="art-disc" />
              <div className="art-glow" />
              <span className="art-caption">LIGHT / FORM / FEELING</span>
            </div>
            <span className="art-index">01 — 03</span>
          </div>
        )}

        <a className="scroll-cue" href="#/portfolio">
          <span className="scroll-line" aria-hidden="true" />
          Scroll to explore
        </a>
      </section>

      <section className="portfolio-section" id="featured" aria-labelledby="featured-title">
        {content?.settings.error && (
          <p className="inline-error" role="alert">{content.settings.error}</p>
        )}
        {imageError && (
          <p className="inline-error" role="alert">Unable to load public images: {imageError}</p>
        )}
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              The portfolio
            </p>
            <h2 id="featured-title">Selected moments</h2>
          </div>
          <a className="text-link" href="#/portfolio">
            View the portfolio <span aria-hidden="true">↗</span>
          </a>
        </div>
        {loading ? (
          <p className="loading-note">Loading published work…</p>
        ) : images.length ? (
          <div className="featured-grid">
            {images.map((image) => {
              const src = urls[image.image_path]
              return src ? (
                <a className="featured-image" href="#/portfolio" key={image.id}>
                  <img
                    src={src}
                    alt={image.alt_text || image.caption || 'Portfolio photograph'}
                    loading="lazy"
                  />
                  {image.caption && <span>{image.caption}</span>}
                </a>
              ) : null
            })}
          </div>
        ) : (
          <EmptyState
            title="No photographs published yet"
            message={content?.images.error || 'The portfolio will appear here when the photographer publishes their work.'}
          />
        )}

        <div className="home-services" aria-labelledby="home-services-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true" />
                Photography services
              </p>
              <h2 id="home-services-title">Made for your moment</h2>
            </div>
            <a className="text-link" href="#/services">
              Explore services <span aria-hidden="true">↗</span>
            </a>
          </div>
          {services.length ? (
            <div className="service-grid">
              {services.slice(0, 3).map((service) => (
                <article className="service-card" key={service.id}>
                  <span className="card-index">— / {String(service.sort_order + 1).padStart(2, '0')}</span>
                  <h3>{service.name}</h3>
                  {service.description && <p>{service.description}</p>}
                  <span className="service-price">
                    {service.pricing_type === 'quote'
                      ? 'Custom quotation'
                      : service.price_amount === null
                        ? ''
                        : formatPrice(service.price_amount, settings?.currency || 'NGN')}
                  </span>
                </article>
              ))}
            </div>
          ) : !loading ? (
            <EmptyState
              title="Services will appear here"
              message={content?.services.error || 'No services have been published.'}
            />
          ) : null}
        </div>

        <div className="home-testimonials" aria-labelledby="testimonial-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true" />
                Client words
              </p>
              <h2 id="testimonial-title">Shared with gratitude</h2>
            </div>
          </div>
          {testimonials.length ? (
            <div className="testimonial-grid">
              {testimonials.slice(0, 3).map((review) => (
                <figure className="testimonial-card" key={review.id}>
                  <div className="rating" aria-label={`${review.rating} out of 5 stars`}>
                    {'★'.repeat(Math.max(0, Math.min(5, review.rating)))}
                  </div>
                  <blockquote>{review.review}</blockquote>
                  <figcaption>{review.customer_name}</figcaption>
                  {review.photographer_response && (
                    <p className="photographer-response">{review.photographer_response}</p>
                  )}
                </figure>
              ))}
            </div>
          ) : !loading ? (
            <EmptyState
              title="Client reviews will appear here"
              message={content?.testimonials.error || 'There are no approved reviews yet.'}
            />
          ) : null}
        </div>

        <div className="home-journal" aria-labelledby="journal-preview-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-line" aria-hidden="true" />
                From the journal
              </p>
              <h2 id="journal-preview-title">Notes & stories</h2>
            </div>
            <a className="text-link" href="#/journal">
              Read the journal <span aria-hidden="true">↗</span>
            </a>
          </div>
          {articles.length ? (
            <div className="article-grid">
              {articles.map((article) => (
                <HomeArticleCard
                  article={article}
                  imageUrl={article.cover_image_path ? urls[article.cover_image_path] : undefined}
                  key={article.id}
                />
              ))}
            </div>
          ) : !loading ? (
            <EmptyState
              title="Journal stories will appear here"
              message={content?.articles.error || 'No articles have been published yet.'}
            />
          ) : null}
        </div>
      </section>

      <section className="booking-callout" aria-labelledby="booking-callout-title">
        <p className="eyebrow">
          <span className="eyebrow-line" aria-hidden="true" />
          Begin a conversation
        </p>
        <h2 id="booking-callout-title">Let’s make something meaningful.</h2>
        <a className="button-link" href="#/booking">
          Request a session <span aria-hidden="true">↗</span>
        </a>
        {error && <p className="sr-only" role="status">{error}</p>}
      </section>
    </>
  )
}

function HomeArticleCard({
  article,
  imageUrl,
}: {
  article: JournalArticleRow
  imageUrl: string | undefined
}) {
  return (
    <a
      className="article-card"
      href={`#/journal/${encodeURIComponent(article.slug)}`}
    >
      {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
      <span className="article-date">{formatDate(article.publication_date)}</span>
      <h3>{article.title}</h3>
      {article.excerpt && <p>{article.excerpt}</p>}
    </a>
  )
}

export default Home
