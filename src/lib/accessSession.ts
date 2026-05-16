export const AUTH_COOKIE_NAME = 'dogana_session'

const SESSION_VERSION = 'v1'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

interface AuthConfig {
  enabled: boolean
  misconfigured: boolean
  accessToken: string
  cookieSecret: string
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function digest(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return base64Url(new Uint8Array(bytes))
}

async function hmac(text: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))
  return base64Url(new Uint8Array(signature))
}

export function getAuthConfig(): AuthConfig {
  const accessToken = process.env.DOGANA_ACCESS_TOKEN || ''
  const requireAuth = process.env.DOGANA_REQUIRE_AUTH === 'true'
  const enabled = Boolean(accessToken || requireAuth)
  const cookieSecret = process.env.DOGANA_COOKIE_SECRET || accessToken

  return {
    enabled,
    misconfigured: enabled && !accessToken,
    accessToken,
    cookieSecret,
  }
}

export async function createSessionCookie(accessToken: string, cookieSecret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const tokenHash = await digest(accessToken)
  const payload = `${SESSION_VERSION}.${expiresAt}.${tokenHash}`
  const signature = await hmac(payload, cookieSecret)
  return `${payload}.${signature}`
}

export async function verifySessionCookie(
  cookieValue: string | undefined,
  accessToken: string,
  cookieSecret: string
): Promise<boolean> {
  if (!cookieValue || !accessToken || !cookieSecret) return false

  const parts = cookieValue.split('.')
  if (parts.length !== 4) return false

  const [version, expiresAtRaw, tokenHash, signature] = parts
  if (version !== SESSION_VERSION) return false

  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false

  const expectedTokenHash = await digest(accessToken)
  if (tokenHash !== expectedTokenHash) return false

  const payload = `${version}.${expiresAtRaw}.${tokenHash}`
  const expectedSignature = await hmac(payload, cookieSecret)
  return signature === expectedSignature
}

export function sessionMaxAgeSeconds(): number {
  return Math.floor(SESSION_TTL_MS / 1000)
}
