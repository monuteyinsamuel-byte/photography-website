import { useEffect, useState } from 'react'

function currentRoute(): string {
  return window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '') || 'home'
}

export function useHashRoute(): string {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const updateRoute = () => setRoute(currentRoute())
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  return route
}
