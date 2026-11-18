import { useCallback } from 'react'
import EmptyState from '../../components/shared/EmptyState'
import PageHeading from '../../components/shared/PageHeading'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import { loadServices, loadSiteSettings } from '../../lib/publicData'
import { formatPrice } from '../../utils/formatting'

function Services() {
  const loader = useCallback(async () => {
    const [services, settings] = await Promise.all([loadServices(), loadSiteSettings()])
    return { data: { services, settings }, error: null }
  }, [])
  const result = useResource(loader)
  const services = result.data?.services.data ?? []
  const servicesError = result.data?.services.error
  const currency = result.data?.settings.data?.currency || 'NGN'
  usePageMeta(
    result.data?.settings.data?.website_title
      ? `Services | ${result.data.settings.data.website_title}`
      : 'Services',
    'Photography services and packages published by the studio.',
  )

  return (
    <section className="page-section" aria-labelledby="services-title">
      <PageHeading
        id="services-title"
        eyebrow="Work together"
        title="Photography services"
        description="Explore the sessions and packages the photographer currently offers."
      />
      {result.loading && <p className="loading-note">Loading published services…</p>}
      {result.error && <p className="inline-error" role="alert">{result.error}</p>}
      {servicesError && <p className="inline-error" role="alert">{servicesError}</p>}
      {services.length ? (
        <div className="service-grid service-grid-page">
          {services.map((service, index) => (
            <article className="service-card" key={service.id}>
              <span className="card-index">— / {String(index + 1).padStart(2, '0')}</span>
              <h2>{service.name}</h2>
              {service.description && <p>{service.description}</p>}
              <span className="service-price">
                {service.pricing_type === 'quote'
                  ? 'Custom quotation'
                  : service.price_amount === null
                    ? 'Contact for pricing'
                    : formatPrice(service.price_amount, currency)}
              </span>
              <a className="text-link" href="#/booking">
                Request this service <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      ) : !result.loading && !result.error && !servicesError ? (
        <EmptyState
          title="No services have been published"
          message="Published session details and prices will appear here."
        />
      ) : null}
      <div className="page-cta">
        <p>Have a particular session in mind?</p>
        <a className="button-link" href="#/booking">
          Make a booking enquiry <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  )
}

export default Services
