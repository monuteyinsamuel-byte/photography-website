import { useState, type FormEvent } from 'react'
import { submitEnquiry } from '../../lib/publicData'

function ContactForm() {
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const values = new FormData(form)
    if (values.get('website')) {
      setError('Unable to submit this message. Please try again.')
      return
    }
    setBusy(true)
    try {
      const result = await submitEnquiry({
        name: String(values.get('name')).trim(),
        email: String(values.get('email')).trim(),
        phone: String(values.get('phone')).trim() || null,
        message: String(values.get('message')).trim(),
      })
      if (result.error) {
        setError(`Your message could not be sent: ${result.error}`)
      } else {
        setSubmitted(true)
        form.reset()
      }
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? `Your message could not be sent: ${submitError.message}`
          : 'Your message could not be sent. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    return (
      <div className="form-success" role="status">
        <h2>Thank you for reaching out</h2>
        <p>Your enquiry has been sent to the photographer.</p>
        <button type="button" className="text-link" onClick={() => setSubmitted(false)}>
          Send another message <span aria-hidden="true">↗</span>
        </button>
      </div>
    )
  }

  return (
    <form className="public-form" onSubmit={handleSubmit}>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-grid">
        <label>
          Name
          <input name="name" autoComplete="name" required maxLength={120} />
        </label>
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label>
          Phone number <span className="optional-label">Optional</span>
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={30} />
        </label>
        <label className="form-full">
          Message
          <textarea name="message" rows={6} required maxLength={5000} />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button-link" type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Send enquiry'} <span aria-hidden="true">↗</span>
      </button>
    </form>
  )
}

export default ContactForm
