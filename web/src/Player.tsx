import { useEffect, useRef, useState } from 'react'

type PlayerProps = {
  title: string
  // The URL the video is streamed from (the API checks the ticket on every request).
  src: string
  // A wide picture shown before the film starts.
  art: string | undefined
  // true once the playback check said yes.
  open: boolean
  // true while that check is running.
  busy: boolean
  // Why the check said no, if it did.
  message: string | null
  // Ask the API for permission to watch.
  onPlay: () => void
}

// Where each film was last stopped, so a trip to another tab does not send the viewer back to 0:00.
// A stand-in until watch progress is saved on the server.
const resumeAt = new Map<string, number>()

// The <video> tag only says "it failed". Ask the API again, quietly, to find out why.
async function explainFailure(src: string): Promise<string> {
  try {
    const res = await fetch(src, { headers: { Range: 'bytes=0-0' } })
    if (res.ok) {
      void res.body?.cancel()
      return "The video couldn't play in this browser. Try another browser, or try again."
    }
    let detail = ''
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      // the error body was not JSON, so keep the default text
    }
    if (detail === 'NOT_LOGGED_IN') {
      return 'Your session ended. Sign in again to keep watching.'
    }
    if (detail === 'NOT_PURCHASED') {
      return 'You need a ticket for this premiere.'
    }
    if (detail === 'WINDOW_ENDED') {
      return 'This premiere has ended.'
    }
    if (detail === 'PREMIERE_NOT_STARTED') {
      return "This premiere hasn't started yet."
    }
    if (detail === 'VIDEO_NOT_FOUND') {
      return "This film isn't ready to stream yet. Check back soon."
    }
  } catch {
    return "Can't reach the server. Check your connection and try again."
  }
  return 'Something went wrong loading the video. Try again.'
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

type VideoProps = {
  title: string
  src: string
  art: string | undefined
  onRetry: () => void
}

// Only mounted after the playback check passed. Its own state starts fresh every time it mounts.
function Video({ title, src, art, onRetry }: VideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    // Keyboard users lose the play button when it goes away, so hand them the video.
    ref.current?.focus({ preventScroll: true })
  }, [])

  async function handleError() {
    setLoading(false)
    setFailure(await explainFailure(src))
  }

  return (
    <>
      <video
        ref={ref}
        className="player-video"
        src={src}
        poster={art}
        controls={failure === null}
        autoPlay
        playsInline
        preload="auto"
        controlsList="nodownload"
        aria-label={title}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget
          const saved = resumeAt.get(src)
          if (saved !== undefined && saved > 5 && saved < video.duration - 5) {
            video.currentTime = saved
          }
        }}
        onTimeUpdate={(e) => resumeAt.set(src, e.currentTarget.currentTime)}
        onEnded={() => resumeAt.delete(src)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => setLoading(false)}
        onError={handleError}
      />

      {loading && failure === null && <span className="player-spinner" role="status" aria-label="Loading video" />}

      {failure !== null && (
        <div className="player-error" role="alert">
          <p>{failure}</p>
          <button type="button" className="btn btn-outline" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </>
  )
}

function Player({ title, src, art, open, busy, message, onPlay }: PlayerProps) {
  // Changing this remounts the video, which is how "Try again" starts over.
  const [attempt, setAttempt] = useState(0)

  return (
    <div className="player">
      {open ? (
        <Video key={attempt} title={title} src={src} art={art} onRetry={() => setAttempt(attempt + 1)} />
      ) : (
        <>
          {art !== undefined && (
            <>
              <div className="player-fill" style={{ backgroundImage: `url(${art})` }} aria-hidden="true" />
              <img className="player-art" src={art} alt="" decoding="async" />
            </>
          )}
          <div className="player-shade" aria-hidden="true" />

          <div className="player-foot">
            {message !== null && (
              <p className="player-message" role="status">
                {message}
              </p>
            )}
            <div className="player-bar">
              <button
                type="button"
                className="player-play"
                aria-label={busy ? undefined : `Play ${title}`}
                onClick={onPlay}
                disabled={busy}
              >
                {busy ? <span className="player-spinner is-inline" aria-hidden="true" /> : <PlayIcon />}
                <span>{busy ? 'Checking...' : 'Play'}</span>
              </button>
              <p className="player-caption">We check your ticket first.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Player