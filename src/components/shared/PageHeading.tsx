interface PageHeadingProps {
  id: string
  eyebrow: string
  title: string
  description?: string | null
}

function PageHeading({ id, eyebrow, title, description }: PageHeadingProps) {
  return (
    <header className="page-heading">
      <p className="eyebrow">
        <span className="eyebrow-line" aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 id={id}>{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </header>
  )
}

export default PageHeading
