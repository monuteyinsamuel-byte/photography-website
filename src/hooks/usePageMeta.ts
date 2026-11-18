import { useEffect } from 'react'

export function usePageMeta(
  title: string,
  description: string,
  canonicalUrl?: string | null,
): void {
  useEffect(() => {
    document.title = title
    let descriptionTag = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.name = 'description'
      document.head.append(descriptionTag)
    }
    descriptionTag.content = description

    let canonicalTag = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    )
    if (canonicalUrl) {
      if (!canonicalTag) {
        canonicalTag = document.createElement('link')
        canonicalTag.rel = 'canonical'
        document.head.append(canonicalTag)
      }
      canonicalTag.href = canonicalUrl
    } else {
      canonicalTag?.remove()
    }
  }, [title, description, canonicalUrl])
}
