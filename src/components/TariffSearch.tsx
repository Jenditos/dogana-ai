'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import type { Language } from '@/types'

interface TarikEntry {
  code: string
  desc: string
  cdRate: number
  vat: number
}

interface Props {
  lang: Language
  onSelect?: (code: string, cdRate: number, vat: number, desc: string) => void
  onClose: () => void
}

// Kosovo HS chapter names in Albanian
const CHAPTERS: Record<string, string> = {
  '01':'Kafshë të gjalla','02':'Mish dhe inde të ngrënshme','03':'Peshq','04':'Produkte blegtorale',
  '05':'Produkte të tjera shtazore','06':'Bimë të gjalla','07':'Zarzavate','08':'Fruta dhe arra',
  '09':'Kafe, çaj, erëza','10':'Drithëra','11':'Produkte mulliri','12':'Fara dhe fruta oleike',
  '13':'Laka dhe rrëshira','14':'Produkte bimore të tjera','15':'Dhjamra dhe vajra shtazore',
  '16':'Konserva','17':'Sheqer','18':'Kakao','19':'Ushqime nga drithëra',
  '20':'Produkte nga zarzavate/fruta','21':'Ushqime të ndryshme','22':'Pije, alkool, uthull',
  '23':'Mbeturina ushqimore','24':'Duhan','25':'Kripë, gëlqere, çimento',
  '26':'Xeherorë metalike','27':'Karburant dhe naftë','28':'Kimikate inorganike',
  '29':'Kimikate organike','30':'Farmaceutike','31':'Plehrues',
  '32':'Bojëra, ngjyra, llak','33':'Kozmetikë, parfume','34':'Sapun, detergjent',
  '35':'Substanca albuminoide','36':'Fishekzjarre','37':'Produkte fotografike',
  '38':'Produkte kimike të ndryshme','39':'Plastikë','40':'Gome',
  '41':'Lëkurë','42':'Çanta, valixhe, lëkurë','43':'Gëzof','44':'Dru dhe artikuj druri',
  '45':'Tapa, plisë','46':'Produkte thurjeje','47':'Celulozë, letër e papërpunuar',
  '48':'Letër dhe karton','49':'Libra, botime të shtypura','50':'Mëndafsh',
  '51':'Lesh, qime','52':'Pambuk','53':'Fibra tekstile të tjera vegjetale',
  '54':'Filamente sintetike','55':'Fibra sintetike shkurtë','56':'Vata, fije',
  '57':'Tapeteri','58':'Tkanina speciale','59':'Tkanina të impregnuara',
  '60':'Trikotazh','61':'Veshje trikotazh','62':'Veshje jo trikotazh',
  '63':'Artikuj tekstile të tjerë','64':'Këpucë','65':'Kapelë',
  '66':'Çadra, bastune','67':'Pupla, lule artificiale',
  '68':'Gurë, çimento, gips','69':'Qeramikë','70':'Qelq',
  '71':'Guri i çmuar, bizhuteri','72':'Hekur dhe çelik','73':'Artikuj hekuri',
  '74':'Bakër','75':'Nikel','76':'Alumin','78':'Plumb',
  '79':'Zink','80':'Kallaj','81':'Metale të tjera',
  '82':'Vegla, thika, lugë','83':'Artikuj metalike të ndryshëm',
  '84':'Makina mekanike','85':'Pajisje elektrike','86':'Lokomotiva, hekurudhë',
  '87':'Automjete','88':'Avionë, hapësinorë','89':'Anije',
  '90':'Optikë, mjete matëse','91':'Orë','92':'Instrumente muzikore',
  '93':'Armë','94':'Mobilie, llamba','95':'Lodra, sporte',
  '96':'Artikuj të ndryshëm','97':'Vepra arti',
}

/* ── SVGs ── */
const IcoSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoSpin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>

export default function TariffSearch({ lang, onSelect, onClose }: Props) {
  const [db,          setDb]          = useState<TarikEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [query,       setQuery]       = useState('')
  const [chFilter,    setChFilter]    = useState('')
  const [selected,    setSelected]    = useState<TarikEntry | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sq = lang === 'sq'

  // Load TARIK database lazily
  useEffect(() => {
    fetch('/tarik.json')
      .then(r => r.json())
      .then((raw: [string, string, number, number][]) => {
        const parsed: TarikEntry[] = raw.map(([code, desc, cdRate, vat]) => ({ code, desc, cdRate, vat }))
        setDb(parsed)
        setLoading(false)
        inputRef.current?.focus()
      })
      .catch(() => setLoading(false))
  }, [])

  const results = useMemo(() => {
    const qUpper = query.trim().toUpperCase()
    let filtered = db

    if (chFilter) filtered = filtered.filter(e => e.code.startsWith(chFilter))

    if (!qUpper) {
      return filtered.slice(0, 50)
    }

    const isCode = /^\d/.test(qUpper)
    if (isCode) {
      filtered = filtered.filter(e => e.code.startsWith(qUpper.replace(/\s/g, '')))
    } else {
      const words = qUpper.split(/\s+/).filter(Boolean)
      filtered = filtered.filter(e => {
        const d = e.desc.toUpperCase()
        return words.every(w => d.includes(w))
      })
    }

    return filtered.slice(0, 100)
  }, [query, chFilter, db])

  const handleSelect = (entry: TarikEntry) => {
    setSelected(entry)
    if (onSelect) {
      onSelect(entry.code, entry.cdRate, entry.vat, entry.desc)
      onClose()
    }
  }

  const totalCount = db.length

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div className="a-scale-in" style={{
        width: '100%', maxWidth: 760, height: '85vh',
        background: 'var(--surface)', borderRadius: 20,
        border: '1px solid var(--border)', boxShadow: 'var(--sh-xl)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
                {sq ? 'Kërko kodin tarifor — TARIK 2025' : 'Search tariff code — TARIK 2025'}
              </h3>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)' }}>
                {loading
                  ? (sq ? 'Duke ngarkuar...' : 'Loading...')
                  : `${totalCount.toLocaleString()} ${sq ? 'kode tariforë • Dogana e Kosovës' : 'tariff codes • Kosovo Customs'}`}
              </p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t3)' }}
            ><IcoClose /></button>
          </div>

          {/* Search + chapter filter */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)', pointerEvents: 'none' }}>
                {loading ? <IcoSpin /> : <IcoSearch />}
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={sq ? 'Kodi (p.sh. 8516) ose emërtimi (p.sh. kazan)...' : 'Code (e.g. 8516) or description (e.g. kettle)...'}
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  border: '1.5px solid var(--border)', borderRadius: 11,
                  background: 'var(--surface)', color: 'var(--t1)',
                  fontSize: 14, outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                disabled={loading}
              />
            </div>
            <select
              value={chFilter}
              onChange={e => setChFilter(e.target.value)}
              disabled={loading}
              style={{
                width: 180, padding: '10px 12px',
                border: '1.5px solid var(--border)', borderRadius: 11,
                background: 'var(--surface)', color: chFilter ? 'var(--t1)' : 'var(--t4)',
                fontSize: 13, outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">{sq ? 'Të gjitha kapitujt' : 'All chapters'}</option>
              {Object.entries(CHAPTERS).map(([ch, name]) => (
                <option key={ch} value={ch}>{ch} — {name.slice(0, 28)}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          {!loading && (query || chFilter) && (
            <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--t4)' }}>
              {results.length === 100
                ? (sq ? 'Shfaqen 100 nga shumë rezultate. Precizoni kërkimin.' : 'Showing 100 of many results. Refine your search.')
                : `${results.length} ${sq ? 'rezultate' : 'results'}`}
            </p>
          )}
        </div>

        {/* ── Results list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40, color: 'var(--t4)' }}>
              <IcoSpin />
              <span style={{ fontSize: 13 }}>{sq ? 'Duke ngarkuar 9,299 kode tariforë...' : 'Loading 9,299 tariff codes...'}</span>
            </div>
          )}

          {!loading && !query && !chFilter && (
            <div style={{ padding: '20px 22px' }}>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>
                {sq ? 'Kapitujt kryesorë' : 'Main chapters'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  ['33','Kozmetikë, parfume'],['39','Plastikë'],['42','Çanta, valixhe'],
                  ['48','Letër, karton'],['61','Veshje trikotazh'],['62','Veshje'],
                  ['69','Qeramikë'],['70','Qelq'],['84','Makina'],
                  ['85','Pajisje elektrike'],['87','Automjete'],['94','Mobilie, llamba'],
                  ['95','Lodra, sporte'],['96','Artikuj të ndryshëm'],['90','Optikë, matëse'],
                ].map(([ch, name]) => (
                  <button key={ch} onClick={() => setChFilter(ch)} style={{
                    padding: '8px 12px', borderRadius: 9,
                    border: '1px solid var(--border)', background: 'var(--surface-2)',
                    color: 'var(--t2)', fontSize: 12.5, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-200)'; e.currentTarget.style.background = 'var(--blue-50)'; e.currentTarget.style.color = 'var(--blue)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--t2)'; }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--t4)', marginRight: 6 }}>{ch}</span>{name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && (query || chFilter) && results.map((entry, i) => {
            const chCode = entry.code.slice(0, 2)
            const chName = CHAPTERS[chCode] || ''
            const isSelected = selected?.code === entry.code
            return (
              <button
                key={i}
                onClick={() => handleSelect(entry)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '10px 22px',
                  border: 'none', background: isSelected ? 'var(--blue-50)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'background .12s',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Code */}
                <div style={{ flexShrink: 0, minWidth: 110 }}>
                  <code style={{
                    fontSize: 13, fontWeight: 700,
                    color: isSelected ? 'var(--blue)' : 'var(--t1)',
                    letterSpacing: '.02em',
                  }}>
                    {entry.code.slice(0,4)} {entry.code.slice(4,8)} {entry.code.slice(8,10)}
                  </code>
                  <p style={{ margin: '1px 0 0', fontSize: 10.5, color: 'var(--t4)' }}>{chName}</p>
                </div>

                {/* Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13,
                    color: entry.desc ? 'var(--t2)' : 'var(--t4)',
                    fontStyle: entry.desc ? 'normal' : 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.desc || (sq ? '(pa përshkrim)' : '(no description)')}
                  </p>
                </div>

                {/* Rates */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: entry.cdRate === 0 ? 'var(--green-bg)' : 'var(--blue-50)', color: entry.cdRate === 0 ? 'var(--green)' : 'var(--blue)', border: `1px solid ${entry.cdRate === 0 ? 'var(--green-bdr)' : 'var(--blue-200)'}` }}>
                    CD {entry.cdRate}%
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: 'var(--surface-3)', color: 'var(--t3)', border: '1px solid var(--border)' }}>
                    VAT {entry.vat}%
                  </span>
                </div>

                {/* Select icon */}
                {onSelect && (
                  <div style={{ color: isSelected ? 'var(--green)' : 'var(--t4)', flexShrink: 0, marginLeft: 4 }}>
                    <IcoCheck />
                  </div>
                )}
              </button>
            )
          })}

          {!loading && (query || chFilter) && results.length === 0 && (
            <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--t4)' }}>
              <p style={{ fontSize: 14 }}>{sq ? 'Asnjë rezultat u gjet.' : 'No results found.'}</p>
              <p style={{ fontSize: 12.5, marginTop: 6 }}>{sq ? 'Provo me fjalë të ndryshme ose ndrysho kapitullin.' : 'Try different words or change the chapter.'}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 22px', background: 'var(--surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)' }}>
            TARIK 2025 · {sq ? 'Dogana e Kosovës · HS + Nomenklatura e Kombinuar BE' : 'Kosovo Customs · HS + EU Combined Nomenclature'}
          </p>
          <button onClick={onClose} className="btn btn-ghost" style={{ height: 36, fontSize: 13 }}>
            {sq ? 'Mbyll' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
