import { useEffect, useRef } from 'react'
import type { User } from './types'
import AuthForm from './AuthForm'

type Mode = 'login' | 'signup'

type AuthModalProps = {
  open: boolean
  mode: Mode
  onModeChange: (mode: Mode) => void
  onLoggedIn: (user: User) => void
  onClose: () => void
}

type IconName = 'ticket' | 'home' | 'theater' | 'screen'

const iconPaths: Record<IconName, string[]> = {
  ticket: ['M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z', 'M14 7v10'],
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  theater: ['M3 9l9-5 9 5', 'M5 10v9', 'M9 10v9', 'M15 10v9', 'M19 10v9', 'M3 20h18'],
  screen: ['M3 5h18v11H3z', 'M8 20h8', 'M12 16v4'],
}

const points: { icon: IconName; title: string; text: string }[] = [
  { icon: 'ticket', title: 'Same Day Releases', text: 'New movies when they hit theaters' },
  { icon: 'home', title: 'Watch at Home', text: 'Stream on your devices' },
  { icon: 'theater', title: 'Partnered Theaters', text: 'Support your local cinema' },
  { icon: 'screen', title: 'Any Device', text: 'TV, phone, tablet, or computer' },
]

function AuthModal({ open, mode, onModeChange, onLoggedIn, onClose }: AuthModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const isSignup = mode === 'signup'

  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) {
      return
    }
    if (open) {
      if (!dialog.open) {
        dialog.showModal()
      }
      // start with the cursor in the first field
      dialog.querySelector('input')?.focus()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open, mode])

  return (
    <dialog
      ref={ref}
      className="auth-screen"
      aria-label={isSignup ? 'Create account' : 'Sign in'}
      onClose={onClose}
    >
      {open && (
        <div className={isSignup ? 'auth-layout auth-signup' : 'auth-layout auth-login'}>
          <button type="button" className="auth-back" aria-label="Back" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="M11 6l-6 6 6 6" />
            </svg>
          </button>

          <button type="button" className="auth-logo" aria-label="Same Day Premiere, back to home" onClick={onClose}>
            <svg viewBox="0 0 44 44" width="40" height="40" aria-hidden="true">
              <path d="M14 5 L14 35 L41 20 Z" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M5 11 L5 41 L32 26 Z" fill="#fc2e36" strokeLinejoin="round" />
            </svg>
            <span className="logo-text">
              Same Day
              <br />
              Premiere
            </span>
          </button>

          {isSignup && (
            <p className="auth-top-link">
              Already have an account?
              <button type="button" className="auth-top-btn" onClick={() => onModeChange('login')}>
                Sign In
              </button>
            </p>
          )}

          {isSignup && (
            <section className="auth-hero">
              {/* TODO: the background is a stand-in for the movie artwork. */}
              <p className="auth-kicker">Same movies. Same day.</p>
              <h2 className="auth-headline">Premieres Beyond the Theater.</h2>
              <p className="auth-lede">
                Watch the biggest new releases at home or at participating theaters. Same day.
              </p>
              <ul className="auth-points">
                {points.map((p) => (
                  <li key={p.title}>
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {iconPaths[p.icon].map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </svg>
                    <div>
                      <strong>{p.title}</strong>
                      <span>{p.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="auth-side">
            <div className="auth-card">
              <AuthForm key={mode} mode={mode} onLoggedIn={onLoggedIn} />
              <p className="auth-foot">
                {isSignup ? 'Already have an account?' : 'New to Same Day Premiere?'}{' '}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => onModeChange(isSignup ? 'login' : 'signup')}
                >
                  {isSignup ? 'Sign In' : 'Create an account'}
                </button>
              </p>
            </div>
          </div>

          {!isSignup && (
            <div className="auth-art" aria-hidden="true">
              {/* TODO: stand-in for the cinema street photo. */}
              <span className="auth-neon">Cinema</span>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}

export default AuthModal