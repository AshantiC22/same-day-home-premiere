import { useEffect, useState } from 'react'
import type { User } from './types'
import { api } from './api'
import Catalog from './Catalog'
import AuthModal from './AuthModal'
import PremierePage from './PremierePage'
import Admin from './Admin'
import Header from './Header'
import Hero from './Hero'
import TheaterQuality from './TheaterQuality'
import HowItWorks from './HowItWorks'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api<User>('/api/me')
        if (!cancelled) {
          setUser(data)
        }
      } catch {
        // a 401 just means not logged in
      } finally {
        if (!cancelled) {
          setChecking(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogout() {
    try {
      await api<null>('/api/auth/logout', { method: 'POST' })
    } catch {
      // even if this fails, clear the screen
    }
    setUser(null)
  }

  // open a premiere, or go back to the catalog, and start at the top of the page.
  // 'instant' skips the smooth scrolling that anchor links use.
  function show(id: number | null) {
    setSelectedId(id)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  if (checking) {
    return <p>Loading...</p>
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} onSignIn={() => setAuthOpen(true)} />

      {/* the key makes each screen fade in when you switch between home and a movie */}
      <div className="view" key={selectedId ?? 'home'}>
        {selectedId === null ? (
          <>
            <Hero onSelect={show} />
            <main className="container">
              {user !== null && user.role === 'admin' && <Admin />}
              <section id="premieres">
                <Catalog onSelect={show} />
              </section>
            </main>
            <TheaterQuality />
            <HowItWorks />
          </>
        ) : (
          <PremierePage premiereId={selectedId} onBack={() => show(null)} />
        )}
      </div>

      <AuthModal
        open={authOpen}
        mode={mode}
        onModeChange={setMode}
        onLoggedIn={(u) => {
          setUser(u)
          setAuthOpen(false)
        }}
        onClose={() => setAuthOpen(false)}
      />
    </>
  )
}

export default App