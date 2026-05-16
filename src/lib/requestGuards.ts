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
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''

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

async function redisIncrement(key: string, windowSeconds: number): Promise<number | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null

  const encodedKey = encodeURIComponent(key)
  const headers = { Authorization: `Bearer ${REDIS_TOKEN}` }

  try {
    const incrRes = await fetch(`${REDIS_URL}/incr/${encodedKey}`, { headers, cache: 'no-store' })
    if (!incrRes.ok) return null
    const incrData = await incrRes.json() as { result?: number }
    const count = Number(incrData.result)

    if (count === 1) {
      await fetch(`${REDIS_URL}/expire/${encodedKey}/${windowSeconds}`, { headers, cache: 'no-store' })
    }

    return Number.isFinite(count) ? count : null
  } catch (error) {
    console.warn('[RateLimit] Redis unavailable, falling back to memory:', error)
    return null
  }
}

function memoryLimit(key: string, options: GuardOptions, now: number): { allowed: boolean; retryAfter: number } {
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  existing.count += 1
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

  if (buckets.size > 1000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  return { allowed: existing.count <= options.limit, retryAfter }
}

function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}

export async function guardApiRequest(
  req: NextRequest,
  scope: string,
  options: GuardOptions
): Promise<NextResponse | null> {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  const now = Date.now()
  const ip = getClientIp(req)
  const key = `${scope}:${ip}`
  const windowSeconds = Math.ceil(options.windowMs / 1000)
  const redisCount = await redisIncrement(key, windowSeconds)

  if (redisCount !== null) {
    return redisCount > options.limit ? tooManyRequests(windowSeconds) : null
  }

  const memory = memoryLimit(key, options, now)
  if (!memory.allowed) return tooManyRequests(memory.retryAfter)

  return null
}
