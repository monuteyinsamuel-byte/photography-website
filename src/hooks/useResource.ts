import { useEffect, useState } from 'react'
import type { Resource } from '../lib/publicData'

export interface ResourceState<T> extends Resource<T> {
  loading: boolean
}

interface StoredResource<T> extends ResourceState<T> {
  loader: () => Promise<Resource<T>>
}

export function useResource<T>(
  loader: () => Promise<Resource<T>>,
): ResourceState<T> {
  const [stored, setStored] = useState<StoredResource<T>>(() => ({
    loader,
    data: null,
    error: null,
    loading: true,
  }))

  useEffect(() => {
    let active = true
    loader().then(
      (result) => {
        if (active) setStored({ ...result, loader, loading: false })
      },
      (error: unknown) => {
        if (active) {
          setStored({
            loader,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to load public content.',
            loading: false,
          })
        }
      },
    )
    return () => {
      active = false
    }
  }, [loader])

  if (stored.loader !== loader) {
    return { data: null, error: null, loading: true }
  }
  return stored
}
