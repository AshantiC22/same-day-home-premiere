import { useState } from 'react'
import type { User } from './types'

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

  return (
    <header className="site-header">
      <div className="container">
        <Logo />

        <nav className="nav" aria-label="Main">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-current={link.label === 'Home' ? 'page' : undefined}
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
              <button
                type="button"
                className="avatar"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {user.email.charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="menu">
                  <p>Logged in as {user.email}</p>
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