import { useEffect, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import type { Premiere } from './types'
import { backdropFor } from './posters'
import { infoFor } from './movieInfo'
import { CastPanel, OverviewPanel, PhotosPanel, ReviewsPanel, SimilarPanel, TrailersPanel } from './DetailPanels'

type PremiereDetailProps = {
  premiere: Premiere
  busy: boolean
  watchMessage: string | null
  onWatch: () => void
  onBack: () => void
  player?: ReactNode
}

type TabId = 'overview' | 'watch' | 'trailers' | 'cast' | 'photos' | 'reviews' | 'similar'

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'watch', label: 'Watch' },
  { id: 'trailers', label: 'Trailers' },
  { id: 'cast', label: 'Cast & Crew' },
  { id: 'photos', label: 'Photos' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'similar', label: 'Similar Movies' },
]

// TODO: theaters and partners are stand-ins until the theater feature exists.
const theaterPoints = [
  'Experience it on the big screen',
  'Premium sound and visuals',
  'Concessions and special events',
  'Support your local theater',
]

const partners = ['Metro Cinemas', 'Grand Theatres', 'Starlight Screens']

type IconName = 'home' | 'seat' | 'check' | 'back' | 'play'

const iconPaths: Record<IconName, string[]> = {
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  seat: ['M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5', 'M4 11a2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 4 0v5H2v-5a2 2 0 0 1 2-2z', 'M6 20v2', 'M18 20v2'],
  check: ['M5 12l5 5 9-10'],
  back: ['M19 12H5', 'M11 6l-6 6 6 6'],
  play: ['M8 5v14l11-7z'],
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={name === 'play' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) {
    return 'Free'
  }
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

function windowLabel(p: Premiere): string {
  const ms = new Date(p.window_ends_at).getTime() - new Date(p.starts_at).getTime()
  const days = Math.round(ms / 86_400_000)
  return days >= 1 ? `${days}-day viewing window` : 'Limited viewing window'
}

function statusLine(p: Premiere): string {
  if (p.state === 'LIVE') {
    return 'In theaters today • Watch at home now'
  }
  const when = new Date(p.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  return `Premieres ${when}`
}

function PremiereDetail({ premiere, busy, watchMessage, onWatch, onBack, player }: PremiereDetailProps) {
  const [tab, setTab] = useState<TabId>('overview')
  // A short message for buttons whose feature is not built yet.
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    const timer = note === null ? undefined : window.setTimeout(() => setNote(null), 3000)
    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
    }
  }, [note])

  const info = infoFor(premiere.title)
  const backdrop = backdropFor(premiere.title)
  const price = formatPrice(premiere.price_cents, premiere.currency)
  const synopsis = premiere.synopsis ?? info?.short ?? null
  const critic = info?.scores[0]
  const wide = tab !== 'overview' && tab !== 'watch'

  function openWatch() {
    setTab('watch')
    document.getElementById('movie-tabs')?.scrollIntoView({ block: 'start' })
  }

  function handleTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (e.key === 'ArrowRight') {
      next = (index + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      next = (index - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Home') {
      next = 0
    } else if (e.key === 'End') {
      next = tabs.length - 1
    } else {
      return
    }
    e.preventDefault()
    const target = tabs[next]
    if (target !== undefined) {
      setTab(target.id)
      document.getElementById(`tab-${target.id}`)?.focus()
    }
  }

  const panelProps = { title: premiere.title, synopsis, info }

  return (
    <>
      <section className={backdrop === undefined ? 'detail-hero no-art' : 'detail-hero'}>
        {backdrop !== undefined && (
          <>
            <div className="detail-hero-fill" style={{ backgroundImage: `url(${backdrop})` }} aria-hidden="true" />
            <img className="detail-hero-img" src={backdrop} alt="" decoding="async" />
          </>
        )}
        <div className="container detail-hero-inner">
          <button type="button" className="detail-back" onClick={onBack}>
            <Icon name="back" size={18} />
            All premieres
          </button>

          <p className="detail-status">
            <span className="badge">Same day</span>
            {statusLine(premiere)}
          </p>
          <h1 className="detail-title">{premiere.title}</h1>
          {info !== undefined && (
            <p className="detail-meta">
              {info.genres.join(' • ')} • {info.runtime} • {info.year} <span className="rating">{info.rating}</span>
            </p>
          )}
          {critic !== undefined && (
            <p className="detail-score">
              <span className="star" aria-hidden="true">★</span> <strong>{critic.value}</strong> {critic.source}
            </p>
          )}
          {synopsis !== null && <p className="detail-synopsis">{synopsis}</p>}

          <div className="detail-actions">
            <button type="button" className="btn btn-primary btn-cta" onClick={openWatch}>
              <Icon name="play" />
              <span>
                <strong>Watch at Home</strong>
                <small>{premiere.price_cents === 0 ? 'Free' : `From ${price}`}</small>
              </span>
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setNote('Theater showtimes are coming soon.')}>
              Find Theater Showtimes
            </button>
          </div>
        </div>
      </section>

      <nav className="detail-tabs" id="movie-tabs" aria-label="Movie sections">
        <div className="container" role="tablist" aria-label="Movie sections">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={t.id === tab}
              aria-controls={`panel-${t.id}`}
              tabIndex={t.id === tab ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => handleTabKey(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className={wide ? 'container detail-grid is-wide' : 'container detail-grid'}>
        <div className="detail-main">
          <div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="detail-panel">
            {tab === 'overview' && <OverviewPanel {...panelProps} />}

            {tab === 'watch' && (
              <section>
                <h2 className="detail-h2">Watch {premiere.title}</h2>
                <p className="detail-sub">Choose how you want to experience it. Same movie. Same day.</p>

                {player !== undefined && <div className="detail-player">{player}</div>}

                <div className="option-cards">
                  <article className="option option-home">
                    <div className="option-head">
                      <span className="option-icon"><Icon name="home" size={26} /></span>
                      <div>
                        <h3>Watch at Home</h3>
                        <p className="option-price">{price}</p>
                      </div>
                    </div>
                    <ul className="ticks">
                      <li><Icon name="check" size={16} />Watch the same day as theaters</li>
                      <li><Icon name="check" size={16} />Stream on TV, computer, phone or tablet</li>
                      <li><Icon name="check" size={16} />{windowLabel(premiere)}</li>
                      <li><Icon name="check" size={16} />Up to 6 devices (same household)</li>
                    </ul>
                    <button type="button" className="btn btn-primary" onClick={onWatch} disabled={busy}>
                      {busy ? 'Checking...' : 'Rent & Watch Now'}
                    </button>
                    {watchMessage !== null && (
                      <p className="option-message" role="status">
                        {watchMessage}
                      </p>
                    )}
                  </article>

                  <article className="option">
                    <div className="option-head">
                      <span className="option-icon"><Icon name="seat" size={26} /></span>
                      <div>
                        <h3>See it in Theaters</h3>
                        <p className="option-price option-price-small">Prices vary by theater</p>
                      </div>
                    </div>
                    <ul className="ticks">
                      {theaterPoints.map((text) => (
                        <li key={text}><Icon name="check" size={16} />{text}</li>
                      ))}
                    </ul>
                    <button type="button" className="btn btn-outline" onClick={() => setNote('Theater showtimes are coming soon.')}>
                      Find Showtimes Near You
                    </button>
                  </article>
                </div>
              </section>
            )}

            {tab === 'trailers' && <TrailersPanel {...panelProps} />}
            {tab === 'cast' && <CastPanel {...panelProps} />}
            {tab === 'photos' && <PhotosPanel {...panelProps} />}
            {tab === 'reviews' && <ReviewsPanel {...panelProps} notify={setNote} />}
            {tab === 'similar' && <SimilarPanel {...panelProps} />}
          </div>
        </div>

        {!wide && (
          <aside className="detail-aside">
            <section className="partners">
              <h2 className="partners-title">Partnered Theaters</h2>
              <p>Watch at home through our partnership with participating theaters.</p>
              <ul className="partner-names">
                {partners.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <button type="button" className="text-link" onClick={() => setNote('The theater list is coming soon.')}>
                See All Partner Theaters →
              </button>
              <div className="partner-art" aria-hidden="true">
                <span className="partner-neon">Cinema</span>
              </div>
            </section>
          </aside>
        )}
      </div>

      {note !== null && (
        <p className="toast" role="status">
          {note}
        </p>
      )}
    </>
  )
}

export default PremiereDetail