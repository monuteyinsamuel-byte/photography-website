import { useCallback, useState, type FormEvent } from 'react'
import EmptyState from '../../components/shared/EmptyState'
import PageHeading from '../../components/shared/PageHeading'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import {
  loadServices,
  loadSiteSettings,
  submitBooking,
} from '../../lib/publicData'
import { whatsappHref } from '../../utils/formatting'

interface BookingProps {
  serviceId?: string
}

function localDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function Booking({ serviceId }: BookingProps) {
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const loader = useCallback(async () => {
    const [services, settings] = await Promise.all([loadServices(), loadSiteSettings()])
    return { data: { services, settings }, error: null }
  }, [])
  const result = useResource(loader)
  const services = result.data?.services.data ?? []
  const servicesError = result.data?.services.error
  const settings = result.data?.settings.data
  const whatsapp = settings?.whatsapp_number

  usePageMeta(
    settings?.website_title ? `Booking | ${settings.website_title}` : 'Booking enquiry',
    'Send a photography session request. Requests are not confirmed until approved by the photographer.',
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const values = new FormData(form)
    if (values.get('website')) {
      setError('Unable to submit this request. Please try again.')
      return
    }
    setBusy(true)
    try {
      const result = await submitBooking({
        full_name: String(values.get('full_name')).trim(),
        phone: String(values.get('phone')).trim(),
        email: String(values.get('email')).trim(),
        service_id: String(values.get('service_id')),
        preferred_date: String(values.get('preferred_date')),
        preferred_time: String(values.get('preferred_time')),
        event_location: String(values.get('event_location')).trim(),
        event_description: String(values.get('event_description')).trim(),
        estimated_budget: values.get('estimated_budget')
          ? Number(values.get('estimated_budget'))
          : null,
        status: 'pending',
      })
      if (result.error) {
        setError(`Your request could not be submitted: ${result.error}`)
      } else {
        setSubmitted(true)
        form.reset()
      }
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? `Your request could not be submitted: ${submitError.message}`
          : 'Your request could not be submitted. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-section form-page" aria-labelledby="booking-title">
      <PageHeading
        id="booking-title"
        eyebrow="Start planning"
        title="Request a session"
        description="Share a few details and the photographer will follow up about your request."
      />
      <p className="form-notice">
        Sending this form is a booking request only. Your session is not confirmed
        until the photographer approves it. Preferred dates and times are requests,
        not live availability.
      </p>
      {result.loading && <p className="loading-note">Loading available services…</p>}
      {result.error && <p className="inline-error" role="alert">{result.error}</p>}
      {servicesError && <p className="inline-error" role="alert">{servicesError}</p>}
      {submitted ? (
        <div className="form-success" role="status">
          <h2>Request received</h2>
          <p>
            Your request has been submitted. The photographer will contact you to
            discuss details. This is not a confirmed booking.
          </p>
          <button type="button" className="text-link" onClick={() => setSubmitted(false)}>
            Send another request <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : services.length ? (
        <form className="public-form" onSubmit={handleSubmit}>
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="booking-website">Leave this field empty</label>
            <input id="booking-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="form-grid">
            <label>
              Full name
              <input name="full_name" autoComplete="name" required maxLength={120} />
            </label>
            <label>
              Phone number
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                maxLength={30}
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              Photography service
              <select name="service_id" defaultValue={serviceId || ''} required>
                <option value="" disabled>
                  Choose a service
                </option>
                {services.map((service) => (
                  <option value={service.id} key={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferred date
              <input name="preferred_date" type="date" min={localDate()} required />
            </label>
            <label>
              Preferred time
              <input name="preferred_time" type="time" required />
            </label>
            <label>
              Event or session location
              <input name="event_location" maxLength={180} required />
            </label>
            <label>
              Estimated budget {settings?.currency && `(${settings.currency})`}
              <input
                name="estimated_budget"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
              />
            </label>
            <label className="form-full">
              Tell us about your session
              <textarea name="event_description" rows={5} maxLength={3000} required />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button-link" type="submit" disabled={busy}>
            {busy ? 'Sending request…' : 'Send booking request'}
            <span aria-hidden="true">↗</span>
          </button>
          <p className="form-footnote">Submitting a request does not reserve a date or confirm a booking.</p>
        </form>
      ) : !result.loading && !result.error && !servicesError ? (
        <EmptyState
          title="Booking requests are not available yet"
          message="The photographer has not published any services. Please get in touch for more information."
        />
      ) : null}
      {whatsapp && (
        <p className="whatsapp-alternative">
          Prefer WhatsApp?{' '}
          <a href={whatsappHref(whatsapp, 'Hello, I would like to enquire about a photography session.')} target="_blank" rel="noreferrer">
            Message the photographer <span aria-hidden="true">↗</span>
          </a>
        </p>
      )}
    </section>
  )
}

export default Booking
