import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { User } from './types'
import { readSeat } from './seat'

type HeaderProps = {
  user: User | null
  onLogout: () => void
  onSignIn: () => void
}

// TODO: TV Shows and My List have no pages yet. Wire or remove before demo day.
const links = [
  { label: 'Home', href: '#top' },
  { label: 'Movies', href: '#premieres' },
  { label: 'TV Shows', href: '#' },
  { label: 'My List', href: '#' },
]

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Same Day Premiere, home">
      <svg viewBox="0 0 44 44" width="40" height="40" aria-hidden="true">
        <path d="M14 5 L14 35 L41 20 Z" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M5 11 L5 41 L32 26 Z" fill="#fc2e36" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">
        Same Day
        <br />
        Premiere
      </span>
    </a>
  )
}

function Header({ user, onLogout, onSignIn }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLElement>(null)

  // Point the stage light at one link. The light and the lit bulbs both read these two numbers from the header.
  const aim = useCallback((link: HTMLElement | null) => {
    const header = headerRef.current
    if (header === null || link === null) {
      return
    }
    const box = link.getBoundingClientRect()
    const edge = header.getBoundingClientRect()
    header.style.setProperty('--lx', `${(box.left - edge.left + box.width / 2).toFixed(1)}px`)
    header.style.setProperty('--lw', `${box.width.toFixed(1)}px`)
  }, [])

  // Back to the page you are on.
  const rest = useCallback(() => {
    aim(navRef.current?.querySelector<HTMLElement>('a[aria-current="page"]') ?? null)
  }, [aim])

  // Put the light on Home before the first paint, with no gliding, so it is already there when the page shows.
  // The gliding is switched on two frames later, for every move after that.
  useLayoutEffect(() => {
    const header = headerRef.current
    rest()
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => header?.classList.add('is-aimed'))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [rest])

  useEffect(() => {
    window.addEventListener('resize', rest)
    // The links move a little once the page font loads.
    void document.fonts?.ready.then(rest)
    return () => {
      window.removeEventListener('resize', rest)
    }
  }, [rest])

  const seat = readSeat()
  const memberNumber = user === null ? '' : String(user.id).padStart(4, '0')
  const shortName = user === null ? '' : user.email.split('@')[0]

  return (
    <header className="site-header" ref={headerRef}>
      <span className="nav-light" aria-hidden="true" />
      <span className="bulbs bulbs-dim" aria-hidden="true" />
      <span className="bulbs bulbs-lit" aria-hidden="true" />

      <div className="container">
        <Logo />

        <nav className="nav" aria-label="Main" ref={navRef} onMouseLeave={rest} onBlur={rest}>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-current={link.label === 'Home' ? 'page' : undefined}
              onMouseEnter={(e) => aim(e.currentTarget)}
              onFocus={(e) => aim(e.currentTarget)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          {/* TODO: search and the bell do nothing yet. */}
          <label className="search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" placeholder="Search movies, genres, or actors..." aria-label="Search" />
          </label>

          <button type="button" className="icon-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7z" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </button>

          {user === null ? (
            <button type="button" className="signin-btn" onClick={onSignIn}>
              Sign in
            </button>
          ) : (
            <div className="account">
              {/* Your account is a ticket stub: your seat (or your initial) and your member number. */}
              <button
                type="button"
                className="avatar stub"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className="stub-seat" aria-hidden="true">
                  {seat ?? user.email.charAt(0).toUpperCase()}
                </span>
                <span className="stub-no" aria-hidden="true">
                  No. {memberNumber}
                </span>
              </button>
              <span className="stub-name" aria-hidden="true">
                {shortName}
              </span>
              {menuOpen && (
                <div className="menu">
                  <p>Logged in as {user.email}</p>
                  {seat !== null && <p>Your seat: {seat}</p>}
                  <button type="button" onClick={onLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header