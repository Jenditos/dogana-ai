'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <section className="card" style={{ maxWidth: 460, padding: 28, textAlign: 'center' }}>
        <h1 style={{ margin: 0, color: 'var(--t1)', fontSize: 22, fontWeight: 900 }}>
          Something went wrong
        </h1>
        <p style={{ margin: '10px 0 20px', color: 'var(--t3)', fontSize: 14 }}>
          The workspace could not complete this action. Please try again.
        </p>
        <button className="btn btn-primary" onClick={reset}>
          Retry
        </button>
      </section>
    </main>
  )
}
