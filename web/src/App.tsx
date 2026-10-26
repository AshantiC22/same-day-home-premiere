import { useEffect, useState } from 'react'
import type { User } from './types'
import { api } from './api'
import Catalog from './Catalog'
import AuthForm from './AuthForm'
import PremierePage from './PremierePage'
import Admin from './Admin'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [selectedId, setSelectedId] = useState<number | null>(null)

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

  if (checking) {
    return <p>Loading...</p>
  }

  return (
    <>
    
      <h1>Same-Day Home Premiere</h1>
     
      {user === null ? (
        <>
          <AuthForm mode={mode} onLoggedIn={setUser} />
          <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Need an account? Create one' : 'Have an account? Log in'}
          </button>
        </>
      ) : (
        <>
        
          <p>Logged in as {user.email}</p>
           { user.role === 'admin' && <Admin />}
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </>
      )}
      {selectedId === null ? (
        <Catalog onSelect={setSelectedId} />
      ) : (
        <PremierePage premiereId={selectedId} onBack={() => setSelectedId(null)} />
      )}
   
    </>
    
  )
}

export default App