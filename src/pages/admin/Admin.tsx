import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FunctionsHttpError, type Session } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase'
import './admin.css'

type AccessState =
  | 'checking'
  | 'signed-out'
  | 'admin'
  | 'not-admin'
  | 'error'

async function setupFunctionErrorMessage(error: Error): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const body: unknown = await error.context.clone().json()
      if (
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'string'
      ) {
        return body.error
      }
    } catch (parseError: unknown) {
      console.error('Unable to read administrator setup response:', parseError)
    }
  }
  console.error('Administrator setup failed:', error)
  return 'Unable to complete initial administrator setup. Please try again.'
}

function Admin({ route }: { route: string }) {
  const [access, setAccess] = useState<AccessState>('checking')
  const [accessError, setAccessError] = useState('')
  const configured = isSupabaseConfigured()
  const isSetupRoute = route === 'admin/setup'
  const isLoginRoute = route === 'admin/login'

  useEffect(() => {
    if (!configured) return

    const supabase = getSupabaseClient()
    let active = true
    let authEventRevision = 0
    let verificationRevision = 0

    async function checkSession(session: Session | null) {
      const currentVerification = ++verificationRevision
      if (!session) {
        if (active && currentVerification === verificationRevision) {
          setAccess('signed-out')
        }
        return
      }

      try {
        const { data, error } = await supabase.rpc('is_current_admin')
        if (!active || currentVerification !== verificationRevision) return
        if (error) {
          console.error('Unable to verify administrator access:', error)
          setAccess('error')
          setAccessError('Unable to verify administrator access. Please try again.')
          return
        }
        setAccess(data ? 'admin' : 'not-admin')
      } catch (error: unknown) {
        if (!active || currentVerification !== verificationRevision) return
        console.error('Unable to verify administrator access:', error)
        setAccess('error')
        setAccessError('Unable to verify administrator access. Please try again.')
      }
    }

    supabase.auth.getSession().then(
      ({ data, error }) => {
        if (!active || authEventRevision !== 0) return
        if (error) {
          console.error('Unable to check administrator session:', error)
          setAccess('error')
          setAccessError('Unable to check your sign-in. Please try again.')
          return
        }
        void checkSession(data.session)
      },
      (error: unknown) => {
        if (!active || authEventRevision !== 0) return
        console.error('Unable to check administrator session:', error)
        setAccess('error')
        setAccessError('Unable to check your sign-in. Please try again.')
      },
    )

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return
        authEventRevision += 1
        verificationRevision += 1
        setAccess(session ? 'checking' : 'signed-out')
        setAccessError('')
        window.setTimeout(() => void checkSession(session), 0)
      },
    )

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [configured])

  if (!configured) {
    return (
      <AdminMessage
        title="Administrator access unavailable"
        message="Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before using administrator features."
      />
    )
  }
  if (isSetupRoute) {
    return <AdminSetup />
  }
  if (access === 'checking') {
    return (
      <AdminMessage
        title="Checking access"
        message="Verifying your administrator session…"
      />
    )
  }
  if (access === 'error') {
    return (
      <AdminMessage
        title="Administrator access unavailable"
        message={accessError}
      />
    )
  }
  if (access === 'not-admin') {
    return <NotAdministrator />
  }
  if (access === 'admin') {
    return <AdminDashboard />
  }
  if (isLoginRoute || route === 'admin') {
    return <AdminLogin />
  }
  return (
    <AdminMessage
      title="Page not found"
      message="That administrator page does not exist."
      link={{ href: '#/admin', label: 'Go to administrator sign in' }}
    />
  )
}

function AdminSetup() {
  const [setupState, setSetupState] = useState<
    'checking' | 'open' | 'closed' | 'error'
  >('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) return

    let active = true
    getSupabaseClient()
      .rpc('is_admin_setup_available')
      .then(
        ({ data, error }) => {
          if (!active) return
          if (error) {
            console.error('Unable to check initial administrator setup:', error)
            setSetupState('error')
            setErrorMessage('Unable to check initial setup. Please try again.')
          } else {
            setSetupState(data ? 'open' : 'closed')
          }
        },
        (error: unknown) => {
          if (!active) return
          console.error('Unable to check initial administrator setup:', error)
          setSetupState('error')
          setErrorMessage('Unable to check initial setup. Please try again.')
        },
      )

    return () => {
      active = false
    }
  }, [configured])

  if (!configured) {
    return (
      <AdminMessage
        title="Initial setup unavailable"
        message="Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY first."
      />
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    const values = new FormData(event.currentTarget)
    const email = String(values.get('email')).trim().toLowerCase()
    const password = String(values.get('password'))
    const confirmation = String(values.get('confirm_password'))

    if (password !== confirmation) {
      setErrorMessage('The passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const { data, error } = await getSupabaseClient()
        .functions.invoke<
          { success?: boolean; error?: string }
        >('setup-admin', {
          body: {
            setupToken: String(values.get('setup_token')),
            email,
            password,
          },
        })
      if (error) throw error
      if (!data?.success) {
        setErrorMessage(
          data?.error ||
            'Unable to complete initial administrator setup. Please try again.',
        )
        return
      }
      setComplete(true)
      setSetupState('closed')
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? await setupFunctionErrorMessage(error)
          : 'Unable to complete initial administrator setup. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-card" aria-labelledby="admin-setup-title">
        <p className="admin-eyebrow">Initial administrator</p>
        <h1 id="admin-setup-title">Secure your studio</h1>
        {setupState === 'checking' && (
          <p className="admin-muted">Checking one-time setup status…</p>
        )}
        {setupState === 'error' && (
          <p className="admin-error" role="alert">
            {errorMessage}
          </p>
        )}
        {setupState === 'closed' && (
          <div className="admin-notice" role="status">
            <p>
              {complete
                ? 'Your administrator account was created. Sign in to continue.'
                : 'Initial setup has already been claimed. Administrator accounts cannot be registered here.'}
            </p>
            <a className="admin-button" href="#/admin/login">
              Administrator sign in
            </a>
          </div>
        )}
        {setupState === 'open' && !complete && (
          <>
            <p className="admin-muted">
              Create the sole administrator account. You also need the private one-time
              setup token configured for this Supabase project.
            </p>
            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                One-time setup token
                <input
                  name="setup_token"
                  type="password"
                  autoComplete="off"
                  minLength={32}
                  maxLength={256}
                  required
                />
              </label>
              <label>
                Administrator email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              {errorMessage && (
                <p className="admin-error" role="alert">
                  {errorMessage}
                </p>
              )}
              <button className="admin-button" type="submit" disabled={busy}>
                {busy ? 'Creating account…' : 'Create administrator account'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

function AdminLogin() {
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [complete, setComplete] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    const values = new FormData(event.currentTarget)
    setBusy(true)
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: String(values.get('email')).trim().toLowerCase(),
        password: String(values.get('password')),
      })
      if (error) throw error
      setComplete(true)
    } catch (error: unknown) {
      console.error('Administrator sign-in failed:', error)
      setErrorMessage(
        'Unable to sign in. Check your credentials and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-card" aria-labelledby="admin-login-title">
        <p className="admin-eyebrow">Studio administration</p>
        <h1 id="admin-login-title">Welcome back</h1>
        {complete ? (
          <p className="admin-muted" role="status">
            Sign-in complete. Verifying administrator access…
          </p>
        ) : (
          <>
            <p className="admin-muted">
              Sign in with the administrator account for this studio.
            </p>
            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              {errorMessage && (
                <p className="admin-error" role="alert">
                  {errorMessage}
                </p>
              )}
              <button className="admin-button" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

function AdminDashboard() {
  async function signOut() {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) {
      console.error('Unable to sign out administrator:', error)
      window.alert('Unable to sign out. Please try again.')
    }
  }

  return (
    <main className="admin-shell">
      <section
        className="admin-card admin-dashboard"
        aria-labelledby="admin-dashboard-title"
      >
        <p className="admin-eyebrow">Protected administrator area</p>
        <h1 id="admin-dashboard-title">Your studio</h1>
        <p className="admin-muted">
          Your administrator session is verified. Content management will be added
          in the next approved phase.
        </p>
        <div className="admin-actions">
          <a className="admin-button" href="#/home">
            View public website
          </a>
          <button
            className="admin-button admin-button-secondary"
            type="button"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  )
}

function NotAdministrator() {
  const [errorMessage, setErrorMessage] = useState('')

  async function signOut() {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) {
      console.error('Unable to sign out administrator:', error)
      setErrorMessage('Unable to sign out. Please try again.')
    }
  }

  return (
    <AdminMessage
      title="Administrator access required"
      message={
        errorMessage ||
        'This signed-in account is not authorized to administer this website.'
      }
      action={
        <button className="admin-button" type="button" onClick={signOut}>
          Sign out
        </button>
      }
    />
  )
}

function AdminMessage({
  title,
  message,
  link,
  action,
}: {
  title: string
  message: string
  link?: { href: string; label: string }
  action?: ReactNode
}) {
  return (
    <main className="admin-shell">
      <section className="admin-card" aria-labelledby="admin-message-title">
        <p className="admin-eyebrow">Studio administration</p>
        <h1 id="admin-message-title">{title}</h1>
        <p className="admin-muted" role="status">{message}</p>
        {link && (
          <a className="admin-button" href={link.href}>
            {link.label}
          </a>
        )}
        {action}
      </section>
    </main>
  )
}

export default Admin
