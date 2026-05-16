import Link from 'next/link'

interface LegalPageProps {
  title: string
  updated: string
  children: React.ReactNode
}

export default function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '40px 20px' }}>
      <article className="card" style={{ maxWidth: 860, margin: '0 auto', padding: 32, borderRadius: 16 }}>
        <Link href="/" style={{ color: 'var(--blue)', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
          DUDI AI Generator
        </Link>
        <h1 style={{ margin: '18px 0 6px', color: 'var(--t1)', fontSize: 32, lineHeight: 1.1 }}>
          {title}
        </h1>
        <p style={{ margin: '0 0 26px', color: 'var(--t4)', fontSize: 13 }}>
          Last updated: {updated}
        </p>
        <div className="legal-copy">
          {children}
        </div>
      </article>
    </main>
  )
}
