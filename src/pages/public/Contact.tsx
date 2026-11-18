import ContactForm from '../../components/forms/ContactForm'
import EmptyState from '../../components/shared/EmptyState'
import PageHeading from '../../components/shared/PageHeading'
import { useSignedImageUrl } from '../../hooks/useSignedImageUrls'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import { useCallback } from 'react'
import { loadSiteSettings } from '../../lib/publicData'
import { whatsappHref } from '../../utils/formatting'

function Contact() {
  const loader = useCallback(() => loadSiteSettings(), [])
  const result = useResource(loader)
  const settings = result.data
  const { url: profilePhoto, error: profilePhotoError } = useSignedImageUrl(settings?.profile_image_path)
  usePageMeta(
    settings?.website_title ? `Contact | ${settings.website_title}` : 'Contact',
    'Contact the photography studio or send an enquiry.',
  )

  return (
    <section className="page-section contact-page" aria-labelledby="contact-title">
      <PageHeading
        id="contact-title"
        eyebrow="Get in touch"
        title="Start a conversation"
        description="For session enquiries, collaborations, or anything else, send a note below."
      />
      {result.loading && <p className="loading-note">Loading contact details…</p>}
      {result.error && <p className="inline-error" role="alert">{result.error}</p>}
      {profilePhotoError && (
        <p className="inline-error" role="alert">Unable to load the profile image: {profilePhotoError}</p>
      )}
      <div className="contact-layout">
        <div className="contact-details">
          {settings && (
            <>
              {settings.business_name && <h2>{settings.business_name}</h2>}
              {settings.location && <p>{settings.location}</p>}
              {settings.contact_email && (
                <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
              )}
              {settings.whatsapp_number && (
                <a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noreferrer">
                  WhatsApp <span aria-hidden="true">↗</span>
                </a>
              )}
              {settings.social_links && (
                <div className="social-links" aria-label="Social media">
                  {Object.entries(settings.social_links).map(([name, url]) => (
                    <a href={url} target="_blank" rel="noreferrer" key={name}>
                      {name} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              )}
              {!settings.contact_email && !settings.whatsapp_number && !settings.location && (
                <EmptyState
                  title="Contact details will appear here"
                  message="The studio has not published contact information yet."
                />
              )}
            </>
          )}
          {profilePhoto && (
            <img className="contact-profile-image" src={profilePhoto} alt={settings?.photographer_name || 'Photographer'} loading="lazy" />
          )}
        </div>
        <div className="contact-form-panel">
          <h2>Send an enquiry</h2>
          <p>Your message goes directly to the studio.</p>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}

export default Contact
