import { useCallback } from 'react'
import EmptyState from '../../components/shared/EmptyState'
import PageHeading from '../../components/shared/PageHeading'
import { useSignedImageUrl } from '../../hooks/useSignedImageUrls'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useResource } from '../../hooks/useResource'
import { loadSiteSettings } from '../../lib/publicData'

function About() {
  const loader = useCallback(() => loadSiteSettings(), [])
  const result = useResource(loader)
  const settings = result.data
  const { url: profilePhoto, error: profilePhotoError } = useSignedImageUrl(settings?.profile_image_path)
  const paragraphs = settings?.about_text?.split(/\n{2,}/).filter(Boolean) ?? []

  usePageMeta(
    settings?.website_title ? `About | ${settings.website_title}` : 'About',
    settings?.about_text?.slice(0, 155) || 'Learn about the photographer and their approach.',
    settings?.canonical_url ? `${settings.canonical_url.replace(/\/$/, '')}/#/about` : null,
  )

  return (
    <section className="page-section about-page" aria-labelledby="about-title">
      <PageHeading
        id="about-title"
        eyebrow="About the photographer"
        title={settings?.photographer_name || settings?.business_name || 'A little about the studio'}
        description={settings?.tagline}
      />
      {result.loading && <p className="loading-note">Loading studio details…</p>}
      {result.error && <p className="inline-error" role="alert">{result.error}</p>}
      {profilePhotoError && (
        <p className="inline-error" role="alert">Unable to load the profile image: {profilePhotoError}</p>
      )}
      {settings && (
        <div className="about-content">
          {profilePhoto ? (
            <img className="profile-image" src={profilePhoto} alt={settings.photographer_name || 'Photographer'} />
          ) : (
            <div className="profile-art" aria-hidden="true">
              <span className="art-orbit art-orbit-one" />
              <span className="art-orbit art-orbit-two" />
              <span className="art-disc" />
            </div>
          )}
          <div className="about-copy">
            {settings.introduction && <p className="about-introduction">{settings.introduction}</p>}
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {!settings.introduction && !paragraphs.length && (
              <EmptyState
                title="The photographer's story is on its way"
                message="Studio introduction and story will appear here when published."
              />
            )}
            {settings.location && <p className="about-location">{settings.location}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

export default About
