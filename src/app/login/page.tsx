import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: 'var(--bg)',
    }}>
      <section className="card" style={{ width: '100%', maxWidth: 420, padding: 28, borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            display: 'grid', placeItems: 'center',
            background: 'var(--blue)', color: '#fff',
            fontWeight: 900, fontSize: 20,
            boxShadow: '0 8px 24px rgba(var(--blue-rgb), .24)',
          }}>
            D
          </div>
          <div>
            <h1 style={{ margin: 0, color: 'var(--t1)', fontSize: 20, fontWeight: 900 }}>
              DUDI AI Generator
            </h1>
            <p style={{ margin: '2px 0 0', color: 'var(--t3)', fontSize: 13 }}>
              Protected customs workspace
            </p>
          </div>
        </div>

        <Suspense fallback={<div style={{ height: 170 }} />}>
          <LoginForm />
        </Suspense>

        <p style={{ margin: '18px 0 0', color: 'var(--t4)', fontSize: 12, lineHeight: 1.5 }}>
          Access is controlled through the server-side DOGANA_ACCESS_TOKEN environment variable.
        </p>
      </section>
    </main>
  )
}
