import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_BODY_BYTES = 8192
const PENDING_SETUP_KEY = 'initial_admin_setup_pending'
const PENDING_EMAIL_KEY = 'initial_admin_setup_email'
const VERIFICATION_PENDING_MESSAGE =
  'Verify your email using the Supabase Auth message, then submit setup again. Email delivery requires Supabase Auth email confirmation and SMTP configuration.'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function tokenMatches(candidate: string, expected: string): boolean {
  const encoder = new TextEncoder()
  const candidateBytes = encoder.encode(candidate)
  const expectedBytes = encoder.encode(expected)
  if (candidateBytes.length !== expectedBytes.length) return false

  let difference = 0
  for (let index = 0; index < candidateBytes.length; index += 1) {
    difference |= candidateBytes[index] ^ expectedBytes[index]
  }
  return difference === 0
}

async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Request body is required.')

  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new RangeError('Request body is too large.')
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
}

function logFailure(operation: string, error: { message: string }): void {
  console.error(`${operation} failed:`, error.message)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return response(405, { error: 'Method not allowed.' })
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return response(413, { error: 'Request body is too large.' })
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return response(400, { error: 'Request must use JSON.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const expectedToken = Deno.env.get('ADMIN_SETUP_TOKEN')
  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !anonKey ||
    !expectedToken ||
    expectedToken.length < 32 ||
    expectedToken.length > 256
  ) {
    console.error('setup-admin is missing a required server-side secret or configuration.')
    return response(500, { error: 'Initial administrator setup is not configured.' })
  }

  let body: unknown
  try {
    body = await readJsonBody(request)
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return response(413, { error: 'Request body is too large.' })
    }
    return response(400, { error: 'Request must contain valid JSON.' })
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return response(400, { error: 'Request must contain valid JSON fields.' })
  }

  const fields = body as { setupToken?: unknown; email?: unknown; password?: unknown }
  const setupToken = typeof fields.setupToken === 'string' ? fields.setupToken : ''
  const email = typeof fields.email === 'string' ? fields.email.trim().toLowerCase() : ''
  const password = typeof fields.password === 'string' ? fields.password : ''
  if (
    setupToken.length > 256 ||
    !tokenMatches(setupToken, expectedToken) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    password.length < 12 ||
    password.length > 128
  ) {
    return response(400, {
      error: 'Provide the valid setup token, email, and a password of 12–128 characters.',
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: setup, error: setupError } = await supabase
    .from('setup_state')
    .select('admin_user_id')
    .eq('id', true)
    .single()
  if (setupError) {
    logFailure('Unable to read administrator setup state', setupError)
    return response(500, { error: 'Unable to verify initial setup status.' })
  }
  if (setup.admin_user_id) {
    return response(409, { error: 'Initial administrator setup has already been claimed.' })
  }

  const { data: signedIn, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) {
    logFailure('Unable to verify administrator credentials', signInError)
    if (signInError.code !== 'invalid_credentials') {
      return response(401, {
        error: 'Unable to verify administrator credentials or email verification.',
      })
    }

    const { data: signup, error: signupError } = await authClient.auth.signUp({
      email,
      password,
    })
    if (signupError) {
      logFailure('Unable to start administrator email verification', signupError)
      return response(400, {
        error: 'Unable to start email verification. Check the email and try again.',
      })
    }
    if (!signup.user) {
      console.error('Administrator email verification returned no user.')
      return response(500, { error: 'Unable to start email verification.' })
    }
    if (signup.user.identities?.length === 0) {
      return response(200, {
        success: false,
        error:
          'Unable to continue setup. Check your credentials and email verification.',
      })
    }
    if (signup.session || signup.user.email_confirmed_at) {
      return response(503, {
        error:
          'Email confirmation is not enabled. Configure Supabase Auth email confirmation and delivery before setup.',
      })
    }

    const { error: markError } = await supabase.auth.admin.updateUserById(signup.user.id, {
      app_metadata: {
        ...signup.user.app_metadata,
        [PENDING_SETUP_KEY]: true,
        [PENDING_EMAIL_KEY]: email,
      },
    })
    if (markError) {
      logFailure('Unable to mark the pending administrator setup account', markError)
      return response(500, { error: 'Unable to start email verification.' })
    }

    return response(200, {
      success: false,
      error: VERIFICATION_PENDING_MESSAGE,
    })
  }

  if (!signedIn.user) {
    return response(401, { error: 'Unable to verify administrator credentials.' })
  }
  const actualEmail = signedIn.user.email?.trim().toLowerCase()
  if (
    signedIn.user.app_metadata[PENDING_SETUP_KEY] !== true ||
    signedIn.user.app_metadata[PENDING_EMAIL_KEY] !== email ||
    actualEmail !== email
  ) {
    return response(403, {
      error: 'Unable to verify this account for initial administrator setup.',
    })
  }
  if (!signedIn.user.email_confirmed_at) {
    return response(403, {
      error:
        'Administrator email verification is required before setup can finish.',
    })
  }

  const userId = signedIn.user.id
  const { data: claimed, error: claimError } = await supabase.rpc('claim_initial_admin', {
    p_user_id: userId,
    p_email: email,
  })

  if (claimError || !claimed) {
    const { data: currentSetup, error: verifyError } = await supabase
      .from('setup_state')
      .select('admin_user_id')
      .eq('id', true)
      .single()
    if (!verifyError && currentSetup.admin_user_id === userId) {
      return response(201, { success: true })
    }

    if (verifyError) logFailure('Unable to verify administrator setup lock', verifyError)
    if (claimError) logFailure('Unable to claim the initial administrator lock', claimError)
    return response(claimError ? 500 : 409, {
      error: claimError
        ? 'Unable to complete initial administrator setup.'
        : 'Initial administrator setup has already been claimed.',
    })
  }

  const { error: clearMarkerError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...signedIn.user.app_metadata,
      [PENDING_SETUP_KEY]: false,
      [PENDING_EMAIL_KEY]: null,
    },
  })
  if (clearMarkerError) {
    logFailure('Unable to clear the completed setup marker', clearMarkerError)
  }

  return response(201, { success: true })
})
