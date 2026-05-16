'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const next = useMemo(() => {
    const value = searchParams.get('next')
    return value && value.startsWith('/') ? value : '/'
  }, [searchParams])

  const setupMissing = searchParams.get('setup') === 'missing'

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Login failed')
        return
      }
      window.location.assign(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {setupMissing && (
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--red-bg)', color: 'var(--red)',
          border: '1px solid var(--red-bdr)', fontSize: 13, fontWeight: 700,
        }}>
          DOGANA_REQUIRE_AUTH is enabled, but DOGANA_ACCESS_TOKEN is missing.
        </div>
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase' }}>
          Access code
        </span>
        <input
          value={token}
          onChange={event => setToken(event.target.value)}
          type="password"
          autoFocus
          className="field-input"
          placeholder="DOGANA_ACCESS_TOKEN"
          style={{ height: 46, fontSize: 15 }}
        />
      </label>

      {error && (
        <p style={{ margin: 0, color: 'var(--red)', fontSize: 13, fontWeight: 700 }}>
          {error}
        </p>
      )}

      <button className="btn btn-primary" disabled={loading || !token} style={{ height: 48 }}>
        {loading ? 'Checking...' : 'Sign in'}
      </button>
    </form>
  )
}
