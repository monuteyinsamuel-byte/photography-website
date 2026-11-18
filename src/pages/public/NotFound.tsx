import PageHeading from '../../components/shared/PageHeading'

function NotFound() {
  return (
    <section className="page-section">
      <PageHeading
        id="not-found-title"
        eyebrow="Not found"
        title="This page isn't here"
        description="The link may have changed, or this page may no longer be published."
      />
      <a className="button-link" href="#/home">Return home <span aria-hidden="true">↗</span></a>
    </section>
  )
}

export default NotFound
