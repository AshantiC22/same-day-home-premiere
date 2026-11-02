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

// Most browsers can make one element fullscreen. iPhone Safari can only fullscreen the <video> itself,
// so there the video is left to go fullscreen on its own when it starts (see playsInline below).
const canFullscreen = typeof document.documentElement.requestFullscreen === 'function'

// The fullscreen request that is still waiting for the browser to answer, if there is one.
let entering: Promise<void> | null = null

// Press Play and the screen takes over the whole display, like the lights going down.
// Browsers only allow this right after a click, so it is only called from Play and Try again.
function enterTheater(screen: HTMLElement | null) {
  if (screen === null || !canFullscreen || document.fullscreenElement !== null) {
    return
  }
  // If the browser says no, the film just plays on the page instead.
  const request = screen.requestFullscreen().catch(() => {})
  entering = request
  void request.then(() => {
    if (entering === request) {
      entering = null
    }
  })
}

function leaveTheater() {
  function exit() {
    if (document.fullscreenElement !== null) {
      document.exitFullscreen().catch(() => {})
    }
  }
  // A video that fails right away can ask to leave while fullscreen is still starting. At that moment
  // there is nothing to leave yet, so wait for the start to finish and then leave. Otherwise it gets stuck.
  if (entering !== null) {
    void entering.then(exit)
  } else {
    exit()
  }
}

// Where each film was last stopped, so a trip to another tab does not send the viewer back to 0:00.
// A stand-in until watch progress is saved on the server.
const resumeAt = new Map<string, number>()

// The "Feature Presentation" card plays once per film per visit, so a trip to another tab does not replay it.
// It is cleared when the film ends, so watching again gets the card again.
const introSeen = new Set<string>()

// How long the card stays up, in milliseconds. The animations in index.css (.player-intro) are timed to match.
const INTRO_MS = 4400

// Anyone who asked their device to cut back on motion skips the card.
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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
  // true while the film is playing, false when it is paused or stopped.
  onLights: (down: boolean) => void
  onFail: () => void
  onEnd: () => void
}

// Only mounted after the playback check passed. Its own state starts fresh every time it mounts.
function Video({ title, src, art, onRetry, onLights, onFail, onEnd }: VideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)
  // true while the "Feature Presentation" card covers the screen. The film loads behind it and starts when it ends.
  const [intro, setIntro] = useState(() => !introSeen.has(src) && !prefersReducedMotion())

  useEffect(() => {
    if (intro) {
      introSeen.add(src)
      // The lights go down as the card comes up.
      onLights(true)
      // Keyboard users lose the play button when it goes away, so hand them the skip button.
      skipRef.current?.focus({ preventScroll: true })
      const timer = window.setTimeout(() => setIntro(false), INTRO_MS)
      return () => window.clearTimeout(timer)
    }
    // The card is gone (or was never shown): start the film and hand the keyboard to the video.
    const video = ref.current
    video?.focus({ preventScroll: true })
    // A browser can refuse to start a film on its own. Then the video just waits, with its own controls, for a tap.
    video?.play().catch(() => onLights(false))
  }, [intro, src, onLights])

  async function handleError() {
    setIntro(false)
    setLoading(false)
    onLights(false)
    // Leave fullscreen so the message is on the page where it can be read.
    onFail()
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
        playsInline={canFullscreen}
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
        onEnded={() => {
          resumeAt.delete(src)
          introSeen.delete(src)
          onLights(false)
          onEnd()
        }}
        onPause={() => onLights(false)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => {
          setLoading(false)
          onLights(true)
        }}
        onError={handleError}
      />

      {loading && failure === null && <span className="player-spinner" role="status" aria-label="Loading video" />}

      {intro && (
        // A click anywhere on the card, the button included, skips it.
        <div className="player-intro" onClick={() => setIntro(false)}>
          <span className="player-intro-rule" aria-hidden="true" />
          <p className="player-intro-kicker">Feature Presentation</p>
          <p className="player-intro-title">{title}</p>
          <button ref={skipRef} type="button" className="player-intro-skip" aria-label={`Skip intro for ${title}`}>
            Skip intro
          </button>
        </div>
      )}

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
  // House lights: down while the film plays, back up when it pauses or ends.
  const [lightsDown, setLightsDown] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)

  useEffect(() => {
    // Only when the answer just turned into yes. Coming back to this tab later does not count as a click.
    if (open && !wasOpen.current) {
      enterTheater(screenRef.current)
    }
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    // The page around the screen goes dark. A class on <body> lets the header and tab bar dim too.
    document.body.classList.toggle('house-lights-down', lightsDown)
    return () => document.body.classList.remove('house-lights-down')
  }, [lightsDown])

  function handleRetry() {
    enterTheater(screenRef.current)
    setAttempt(attempt + 1)
  }

  return (
    <div ref={screenRef} className={lightsDown ? 'player is-playing' : 'player'}>
      {open ? (
        <Video
          key={attempt}
          title={title}
          src={src}
          art={art}
          onRetry={handleRetry}
          onLights={setLightsDown}
          onFail={leaveTheater}
          onEnd={leaveTheater}
        />
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