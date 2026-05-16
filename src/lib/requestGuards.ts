import { NextRequest, NextResponse } from 'next/server'

interface Bucket {
  count: number
  resetAt: number
}

interface GuardOptions {
  limit: number
  windowMs: number
}

const buckets = new Map<string, Bucket>()

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = req.headers.get('x-real-ip')?.trim()
  return forwarded || realIp || 'unknown'
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true

  const host = req.headers.get('host')
  if (!host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function guardApiRequest(
  req: NextRequest,
  scope: string,
  options: GuardOptions
): NextResponse | null {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  const now = Date.now()
  const ip = getClientIp(req)
  const key = `${scope}:${ip}`
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs })
    return null
  }

  existing.count += 1
  if (existing.count > options.limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  if (buckets.size > 1000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  return null
}
