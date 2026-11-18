import { useResource } from '../../hooks/useResource'
import { loadSiteSettings } from '../../lib/publicData'
import { whatsappHref } from '../../utils/formatting'

const siteYear = new Date().getFullYear()

function Footer() {
  const { data: settings } = useResource(loadSiteSettings)

  return (
    <footer className="site-footer">
      <a className="wordmark footer-wordmark" href="#/home">
        <span className="wordmark-mark" aria-hidden="true">S</span>
        <span>{settings?.business_name || 'Your Studio'}</span>
      </a>
      <div className="footer-contact">
        {settings?.contact_email && (
          <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
        )}
        {settings?.whatsapp_number && (
          <a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noreferrer">WhatsApp</a>
        )}
        {settings?.location && <span>{settings.location}</span>}
      </div>
      <p>© {siteYear} {settings?.business_name || 'Photography studio'}</p>
      <a className="back-to-top" href="#/home">
        Back to top <span aria-hidden="true">↑</span>
      </a>
    </footer>
  )
}

export default Footer
