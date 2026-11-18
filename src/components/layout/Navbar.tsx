import { useState } from 'react'
import { useSignedImageUrl } from '../../hooks/useSignedImageUrls'
import { useResource } from '../../hooks/useResource'
import { loadSiteSettings } from '../../lib/publicData'

interface NavbarProps {
  route: string
}

const links = [
  ['home', 'Home'],
  ['portfolio', 'Portfolio'],
  ['services', 'Services'],
  ['about', 'About'],
  ['journal', 'Journal'],
  ['contact', 'Contact'],
] as const

function Navbar({ route }: NavbarProps) {
  const [openRoute, setOpenRoute] = useState<string | null>(null)
  const menuOpen = openRoute === route
  const settings = useResource(loadSiteSettings)
  const site = settings.data
  const { url: logo } = useSignedImageUrl(site?.logo_path)

  return (
    <header className="site-header">
      <a className="wordmark" href="#/home" aria-label={`${site?.business_name || 'Photography studio'} home`}>
        {logo ? (
          <img className="wordmark-logo" src={logo} alt="" />
        ) : (
          <span className="wordmark-mark" aria-hidden="true">S</span>
        )}
        <span>{site?.business_name || 'Your Studio'}</span>
      </a>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setOpenRoute(menuOpen ? null : route)}
      >
        <span>{menuOpen ? 'Close' : 'Menu'}</span>
        <span className="menu-icon" aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
      </button>
      <nav
        className={`site-nav${menuOpen ? ' is-open' : ''}`}
        id="primary-navigation"
        aria-label="Main navigation"
      >
        {links.map(([path, label]) => (
          <a
            href={`#/${path}`}
            aria-current={route === path || route.startsWith(`${path}/`) ? 'page' : undefined}
            key={path}
            onClick={() => setOpenRoute(null)}
          >
            {label}
          </a>
        ))}
        <a
          className="nav-contact"
          href="#/booking"
          aria-current={route === 'booking' ? 'page' : undefined}
          onClick={() => setOpenRoute(null)}
        >
          Book a session <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  )
}

export default Navbar
