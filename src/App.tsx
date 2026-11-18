import { useHashRoute } from './hooks/useHashRoute'
import About from './pages/public/About'
import Article from './pages/public/Article'
import Booking from './pages/public/Booking'
import Contact from './pages/public/Contact'
import Home from './pages/public/Home'
import Journal from './pages/public/Journal'
import NotFound from './pages/public/NotFound'
import Portfolio from './pages/public/Portfolio'
import Services from './pages/public/Services'
import Admin from './pages/admin/Admin'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import './styles/public.css'
import './styles/public-pages.css'

function decodeRoutePart(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function App() {
  const route = useHashRoute()
  const [routePath, query] = route.split('?', 2)
  const [section, ...parts] = routePath.split('/')
  const search = new URLSearchParams(query)
  if (section === 'admin') return <Admin route={routePath} />

  const content =
    section === 'home' ? <Home /> :
    section === 'portfolio' ? <Portfolio /> :
    section === 'services' ? <Services /> :
    section === 'about' ? <About /> :
    section === 'booking' ? <Booking serviceId={search.get('service') || undefined} /> :
    section === 'contact' ? <Contact /> :
    section === 'journal' && parts.length ? <Article slug={decodeRoutePart(parts.join('/'))} /> :
    section === 'journal' ? <Journal /> :
    <NotFound />

  return (
    <>
      <Navbar route={routePath} />
      <main>{content}</main>
      <Footer />
    </>
  )
}

export default App
