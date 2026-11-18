import { useEffect, useState } from 'react'
import { PORTFOLIO_BUCKET } from '../lib/publicData'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

interface SignedImagesState {
  key: string
  urls: Record<string, string>
  error: string | null
}

export function useSignedImageUrls(paths: readonly (string | null | undefined)[]) {
  const key = paths.filter((path): path is string => Boolean(path)).join('\u001f')
  const [state, setState] = useState<SignedImagesState>({
    key: '',
    urls: {},
    error: null,
  })

  useEffect(() => {
    let active = true
    let refreshTimer: number | undefined

    async function signImages() {
      if (!key) {
        setState({ key, urls: {}, error: null })
        return
      }
      if (!isSupabaseConfigured()) {
        setState({
          key,
          urls: {},
          error: 'Supabase is not configured; private images cannot be loaded.',
        })
        return
      }

      try {
        const uniquePaths = [...new Set(key.split('\u001f'))]
        const results = await Promise.all(
          uniquePaths.map(async (path) => {
            const { data, error } = await getSupabaseClient()
              .storage.from(PORTFOLIO_BUCKET)
              .createSignedUrl(path, 3600)
            return { path, url: error ? null : data.signedUrl, error: error?.message ?? null }
          }),
        )
        if (!active) return
        setState({
          key,
          urls: Object.fromEntries(
            results.flatMap(({ path, url }) => url ? [[path, url]] : []),
          ),
          error: results.find((result) => result.error)?.error ?? null,
        })
        refreshTimer = window.setTimeout(() => void signImages(), 50 * 60 * 1000)
      } catch (error: unknown) {
        if (!active) return
        setState({
          key,
          urls: {},
          error: error instanceof Error ? error.message : 'Unable to load private images.',
        })
      }
    }

    void signImages()
    return () => {
      active = false
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer)
    }
  }, [key])

  return {
    urls: state.key === key ? state.urls : {},
    error: state.key === key ? state.error : null,
  }
}

export function useSignedImageUrl(path: string | null | undefined) {
  const { urls, error } = useSignedImageUrls(path ? [path] : [])
  return { url: path ? urls[path] ?? null : null, error }
}
