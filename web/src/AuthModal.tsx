import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { User } from './types'
import AuthForm from './AuthForm'
import Auditorium from './Auditorium'

type Mode = 'login' | 'signup'

type AuthModalProps = {
  open: boolean
  mode: Mode
  onModeChange: (mode: Mode) => void
  onLoggedIn: (user: User) => void
  onClose: () => void
}

function AuthModal({ open, mode, onModeChange, onLoggedIn, onClose }: AuthModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)
  const roomRef = useRef<HTMLDivElement>(null)
  // The flashlight: where it is now (x, y) and where the mouse is (tx, ty). It eases toward the mouse.
  const light = useRef({ x: 0, y: 0, tx: 0, ty: 0, started: false })
  const frame = useRef(0)
  const isSignup = mode === 'signup'
  // The dialog fades out when it closes (see .auth-screen in index.css). The room stays on screen until the
  // fade is over, then it is removed, so the next visit starts fresh.
  const [shown, setShown] = useState(open)

  useEffect(() => {
    if (open) {
      setShown(true)
      return
    }
    const timer = window.setTimeout(() => setShown(false), 450)
    return () => window.clearTimeout(timer)
  }, [open])

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

  // A new visit starts with the flashlight back at its resting spot.
  useEffect(() => {
    light.current.started = false
  }, [open])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current)
    }
  }, [])

  function step() {
    const el = roomRef.current
    const l = light.current
    if (el === null) {
      frame.current = 0
      return
    }
    l.x += (l.tx - l.x) * 0.16
    l.y += (l.ty - l.y) * 0.16
    el.style.setProperty('--fx', `${l.x.toFixed(1)}px`)
    el.style.setProperty('--fy', `${l.y.toFixed(1)}px`)
    if (Math.abs(l.tx - l.x) > 0.5 || Math.abs(l.ty - l.y) > 0.5) {
      frame.current = requestAnimationFrame(step)
    } else {
      frame.current = 0
    }
  }

  // A mouse moves the flashlight. A finger does not: on a phone it stays where it rests.
  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = layoutRef.current
    if (el === null || e.pointerType === 'touch') {
      return
    }
    const box = el.getBoundingClientRect()
    const l = light.current
    if (!l.started) {
      l.x = box.width * 0.24
      l.y = box.height * 0.72
      l.started = true
    }
    l.tx = e.clientX - box.left
    l.ty = e.clientY - box.top
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(step)
    }
  }

  return (
    <dialog
      ref={ref}
      className="auth-screen"
      aria-label={isSignup ? 'Create account' : 'Sign in'}
      onClose={onClose}
    >
      {(open || shown) && (
        <div
          ref={layoutRef}
          className={isSignup ? 'auth-layout auth-signup' : 'auth-layout auth-login'}
          onPointerMove={handleMove}
        >
          <Auditorium lightRef={roomRef} />

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

          {/* The screen at the front of the room. It shows a slide, like the one before a film starts. */}
          <div className="aud-screen" aria-hidden="true">
            <span className="aud-slide">{isSignup ? 'Take a seat' : 'Welcome back'}</span>
          </div>

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
        </div>
      )}
    </dialog>
  )
}

export default AuthModal