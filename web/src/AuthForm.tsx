import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { User } from './types'
import { api, ApiError } from './api'

type AuthFormProps = {
  mode: 'login' | 'signup'
  onLoggedIn: (user: User) => void
}

// Decorative for now. Preferences and Get Started screens do not exist yet.
const signupSteps = ['Create Account', 'Preferences', 'Get Started']

function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.detail === 'INVALID_CREDENTIALS') {
      return 'Wrong email or password.'
    }
    if (err.detail === 'EMAIL_TAKEN') {
      return 'That email already has an account. Try signing in.'
    }
    if (err.detail === 'ACCOUNT_LOCKED') {
      return 'Too many tries. Wait 15 minutes and try again.'
    }
  }
  return 'Something went wrong. Try again.'
}

function postJson(body: object): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function AuthForm({ mode, onLoggedIn }: AuthFormProps) {
  const isSignup = mode === 'signup'
  // TODO: the API has no name field yet, so this is collected but not saved.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  // TODO: sessions always last 7 days, so "Keep me signed in" changes nothing yet.
  const [keep, setKeep] = useState(true)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isSignup) {
        await api<User>('/api/auth/signup', postJson({ email, password }))
      }
      const user = await api<User>('/api/auth/login', postJson({ email, password }))
      onLoggedIn(user)
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="auth-title">{isSignup ? 'Create Your Account' : 'Sign In'}</h2>
      <p className="auth-sub">
        {isSignup
          ? 'Join Same Day Premiere and start watching the latest movies, same day.'
          : 'Welcome back. Continue watching the latest premieres.'}
      </p>

      {isSignup && (
        <ol className="auth-steps" aria-hidden="true">
          {signupSteps.map((label, i) => (
            <li key={label} className={i === 0 ? 'is-active' : undefined}>
              <span className="auth-step-dot">{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}

      {/* TODO: Google and Apple sign-in are not built. Use their official button artwork when they are. */}
      <button type="button" className="oauth oauth-google" onClick={() => setNote('Google sign-in is coming soon.')}>
        Continue with Google
      </button>
      <button type="button" className="oauth oauth-apple" onClick={() => setNote('Apple sign-in is coming soon.')}>
        Continue with Apple
      </button>
      {note !== null && (
        <p className="auth-note" role="status">
          {note}
        </p>
      )}

      <div className="auth-or">
        <span>or</span>
      </div>

      {isSignup && (
        <>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Tyler Smith"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          />
        </>
      )}

      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
      />

      <label htmlFor="password">{isSignup ? 'Create Password' : 'Password'}</label>
      <div className="pw-field">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
          required
          minLength={isSignup ? 8 : undefined}
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="pw-toggle"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          <EyeIcon crossed={showPassword} />
        </button>
      </div>

      {isSignup ? (
        <label className="check">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAgreed(e.target.checked)}
          />
          <span>
            I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>
          </span>
        </label>
      ) : (
        <div className="auth-row">
          <label className="check">
            <input
              type="checkbox"
              checked={keep}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setKeep(e.target.checked)}
            />
            <span>Keep me signed in</span>
          </label>
          <button type="button" className="text-btn" onClick={() => setNote('Password reset is coming soon.')}>
            Forgot password?
          </button>
        </div>
      )}

      {error !== null && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="auth-submit" disabled={busy}>
        {busy ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
        {!busy && <ArrowIcon />}
      </button>
    </form>
  )
}

export default AuthForm