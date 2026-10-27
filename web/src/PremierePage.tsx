import { useEffect, useState } from 'react'
import type { Premiere } from './types'
import { api, ApiError } from './api'
import PremiereDetail from './PremiereDetail'
import Player from './Player'
import { backdropFor } from './posters'

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
  // true once the playback check said yes. The Player starts the video.
  const [watching, setWatching] = useState(false)

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
      setWatching(true)
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
    <PremiereDetail
      premiere={premiere}
      busy={busy}
      watchMessage={watchMessage}
      onWatch={handleWatch}
      onBack={onBack}
      player={
        <Player
          title={premiere.title}
          src={`/api/premieres/${premiere.id}/stream`}
          art={backdropFor(premiere.title)}
          open={watching}
          busy={busy}
          message={watchMessage}
          onPlay={handleWatch}
        />
      }
    />
  )
}

export default PremierePage