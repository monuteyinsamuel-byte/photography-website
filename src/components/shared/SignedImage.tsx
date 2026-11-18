import { useSignedImageUrl } from '../../hooks/useSignedImageUrls'

interface SignedImageProps {
  path: string | null | undefined
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
}

function SignedImage({ path, alt, className, loading = 'lazy' }: SignedImageProps) {
  const { url, error } = useSignedImageUrl(path)
  if (!url) {
    return error
      ? <span className="signed-image-error" role="status">Image unavailable</span>
      : null
  }
  return <img className={className} src={url} alt={alt} loading={loading} />
}

export default SignedImage
