import { useEffect, useRef, useState } from 'react'
import type { FocusEvent } from 'react'
import type { Premiere } from './types'
import { api } from './api'
import { backdropFor, posterFor } from './posters'
import { infoFor } from './movieInfo'

type HeroProps = {
  onSelect: (id: number) => void
}

type Slide = {
  key: string
  id: number | null
  kicker: string
  small: string | null
  title: string
  tagline: string
  blurb: string
  art: string | undefined
}

const SLIDE_MS = 7000
const MAX_SLIDES = 5

// Shown while the catalog loads, and when there are no premieres yet.
const brandSlide: Slide = {
  key: 'brand',
  id: null,
  kicker: 'Same day premieres',
  small: null,
  title: 'Same Day Premiere',
  tagline: 'In theaters today. At home tonight.',
  blurb:
    'Skip the lines. No crowds. Watch the biggest new releases the same day they hit theaters, from the comfort of your home.',
  art: undefined,
}

function slideFrom(p: Premiere): Slide {
  const info = infoFor(p.title)
  const the = /^the\s+/i.exec(p.title)
  const hasRest = the !== null && p.title.length > the[0].length
  const date = new Date(p.starts_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
  return {
    key: String(p.id),
    id: p.id,
    kicker: p.state === 'LIVE' ? 'Live now' : `Premieres ${date}`,
    small: hasRest ? the[0].trim() : null,
    title: hasRest ? p.title.slice(the[0].length) : p.title,
    tagline: p.state === 'LIVE' ? 'In theaters today. At home tonight.' : 'In theaters and at home, the same day.',
    blurb: p.synopsis ?? info?.short ?? 'Watch it at home the same day it hits theaters.',
    // A wide still if we have one, otherwise the poster.
    art: backdropFor(p.title) ?? posterFor(p.title),
  }
}

function Hero({ onSelect }: HeroProps) {
  const [premieres, setPremieres] = useState<Premiere[]>([])
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const touchStart = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api<Premiere[]>('/api/premieres')
        if (!cancelled) {
          // Live premieres first. The sort is stable, so the API order is kept inside each group.
          const live = data.filter((p) => p.state === 'LIVE')
          const upcoming = data.filter((p) => p.state !== 'LIVE')
          setPremieres([...live, ...upcoming].slice(0, MAX_SLIDES))
        }
      } catch {
        // keep the brand slide; the catalog below shows its own error
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    function onChange() {
      setReduceMotion(query.matches)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const slides = premieres.length > 0 ? premieres.map(slideFrom) : [brandSlide]
  const count = slides.length
  const active = index < count ? index : 0
  // Slides only move by themselves when nothing says to stop.
  const playing = count > 1 && !hovering && !focused && !userPaused && !reduceMotion

  useEffect(() => {
    const timer = playing ? window.setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS) : undefined
    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
    }
  }, [playing, active, count])

  function go(i: number) {
    setIndex(((i % count) + count) % count)
  }

  function handleFocus(e: FocusEvent<HTMLElement>) {
    // Only keyboard focus pauses. A mouse click on a dot should not stop the show.
    if (e.target.matches(':focus-visible')) {
      setFocused(true)
    }
  }

  function handleBlur(e: FocusEvent<HTMLElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setFocused(false)
    }
  }

  return (
    <section
      className={playing ? 'carousel is-playing' : 'carousel'}
      aria-roledescription="carousel"
      aria-label="Featured premieres"
      onPointerEnter={(e) => setHovering(e.pointerType === 'mouse')}
      onPointerLeave={() => setHovering(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current
        const end = e.changedTouches[0]?.clientX
        touchStart.current = null
        if (start !== null && end !== undefined && Math.abs(end - start) > 50) {
          go(active + (end < start ? 1 : -1))
        }
      }}
    >
      <div className="carousel-stage" aria-live={playing ? 'off' : 'polite'}>
        {slides.map((slide, i) => {
          const id = slide.id
          return (
            <article
              key={slide.key}
              className={i === active ? 'slide is-active' : 'slide'}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              inert={i !== active}
            >
              {slide.art !== undefined && (
                <>
                  <div className="slide-fill" style={{ backgroundImage: `url(${slide.art})` }} aria-hidden="true" />
                  <img className="slide-img" src={slide.art} alt="" decoding="async" />
                </>
              )}

              <div className="container slide-inner">
                <div className="slide-copy">
                  <p className="slide-kicker">
                    <strong>{slide.kicker}</strong>
                    <span aria-hidden="true"> • </span>
                    Same day
                  </p>

                  <h2 className="slide-title">
                    {slide.small !== null && <span className="slide-title-small">{slide.small}</span>}
                    {slide.title}
                  </h2>

                  <p className="slide-tagline">{slide.tagline}</p>
                  <p className="slide-blurb">{slide.blurb}</p>

                  <div className="slide-actions">
                    {id === null ? (
                      <a className="btn btn-primary" href="#premieres">
                        Browse Premieres
                      </a>
                    ) : (
                      <>
                        {/* TODO: Watch Now should open the Watch tab. For now both open the movie page. */}
                        <button type="button" className="btn btn-primary" onClick={() => onSelect(id)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <path d="M6 4l14 8-14 8z" />
                          </svg>
                          Watch Now
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => onSelect(id)}>
                          More Info
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {count > 1 && (
        <div className="carousel-controls">
          <button
            type="button"
            className="carousel-pause"
            aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
            onClick={() => setUserPaused(!userPaused)}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
              {userPaused ? <path d="M7 4l13 8-13 8z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
            </svg>
          </button>

          <div className="carousel-dots" role="group" aria-label="Choose a featured premiere">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                className={i === active ? 'dot is-active' : 'dot'}
                aria-label={`Show ${slide.small === null ? '' : `${slide.small} `}${slide.title}`}
                aria-current={i === active}
                onClick={() => go(i)}
              >
                {i === active && playing && (
                  <span className="dot-progress" style={{ animationDuration: `${SLIDE_MS}ms` }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default Hero