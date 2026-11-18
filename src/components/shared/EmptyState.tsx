interface EmptyStateProps {
  title: string
  message?: string | null
  error?: string | null
}

function EmptyState({ title, message, error }: EmptyStateProps) {
  return (
    <div className={`empty-state${error ? ' empty-state-error' : ''}`} role={error ? 'alert' : 'status'}>
      <span className="empty-mark" aria-hidden="true">
        <span />
      </span>
      <p className="empty-title">{error ? 'Content is unavailable' : title}</p>
      <p className="empty-description">{error || message}</p>
    </div>
  )
}

export default EmptyState
