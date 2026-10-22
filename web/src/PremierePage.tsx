import { useEffect, useState } from 'react'
import type { Premiere } from './types'
import { api, ApiError } from './api'

type ShowPageProp = {
  premiereId: number
  onBack: () => void
}

function watchMessageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.detail === 'NOT_LOGGED_IN') {
      return 'Log in to watch this premiere.'
    }
    if (err.detail === 'PREMIERE_NOT_FOUND') {
      return 'This premiere is no longer available.'
    }
    if (err.detail === 'NOT_PURCHASED') {
      return 'You need a ticket for this premiere.'
    }
    if (err.detail === 'WINDOW_ENDED') {
      return 'This premiere has ended.'
    }
    if (err.detail === 'PREMIERE_NOT_STARTED') {
      return "This premiere hasn't started yet."
    }
  }
  return 'Something went wrong. Try again.'
}

function PremierePage({ premiereId, onBack }: ShowPageProp) {
  const [premiere, setPremiere] = useState<Premiere | null>(null)
  const [failed, setFailed] = useState(false)
  const [watchMessage, setWatchMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api<Premiere>(`/api/premieres/${premiereId}`)
        if (!cancelled) {
          setPremiere(data)
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [premiereId])

  async function handleWatch() {
    setBusy(true)
    setWatchMessage(null)
    try {
      await api<{ allowed: boolean }>(`/api/premieres/${premiereId}/playback`, {
        method: 'POST',
      })
      setWatchMessage('Your premiere is open.')
    } catch (err) {
      setWatchMessage(watchMessageFor(err))
    } finally {
      setBusy(false)
    }
  }

  if (failed) {
    return (
      <>
        <p>Could not load this premiere.</p>
        <button type="button" onClick={onBack}>
          Back
        </button>
      </>
    )
  }
  if (premiere === null) {
    return <p>Loading...</p>
  }

  return (
    <>
      <button type="button" onClick={onBack}>
        Back
      </button>
      <h2>{premiere.title}</h2>
      <p>{premiere.state === 'LIVE' ? 'Live now' : 'Upcoming'}</p>
      {premiere.synopsis !== null && <p>{premiere.synopsis}</p>}
      <p>Starts: {new Date(premiere.starts_at).toLocaleString()}</p>
      <p>Price: ${(premiere.price_cents / 100).toFixed(2)}</p>
      <button type="button" onClick={handleWatch} disabled={busy}>
        Watch
      </button>
      {watchMessage !== null && <p>{watchMessage}</p>}
    </>
  )
}

export default PremierePage