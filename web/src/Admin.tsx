import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from './api'
import type { Movie, Premiere } from './types'

type AdminProps = {
  // Called after a premiere is scheduled or cancelled, so the page can reload the public catalog and carousel.
  onChanged?: () => void
}

// The one line shown under a form after it is submitted: a success or an error.
type Notice = { kind: 'ok' | 'error'; text: string } | null

// The browser's own time zone, for example "America/Chicago".
// The start time is typed in this zone, and the API stores it as UTC.
const BROWSER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

// Turn an API error code into a sentence a person can act on.
function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.detail === 'NOT_LOGGED_IN' || err.detail === 'ADMIN_ONLY') {
      return 'Only a signed-in admin can do this.'
    }
    if (err.detail === 'MOVIE_NOT_FOUND') {
      return 'That movie is gone. Reload the page and pick another.'
    }
    if (err.detail === 'STARTS_IN_PAST') {
      return 'Pick a start time that is still in the future.'
    }
    if (err.detail === 'PREMIERE_NOT_FOUND') {
      return 'That premiere is gone. Reload the page.'
    }
    if (err.detail === 'ALREADY_CANCELLED') {
      return 'That premiere was already cancelled.'
    }
    if (err.status === 422) {
      // FastAPI sends a list, not a code, when a field fails its rule, and api() turns that into REQUEST_FAILED.
      return 'Check the fields and try again.'
    }
  }
  return 'Something went wrong. Try again.'
}

// Same helper AuthForm uses: a POST request that carries a JSON body.
function postJson(body: object): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function formatWhen(date: Date): string {
  return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function money(cents: number, currency: string): string {
  if (cents === 0) {
    return 'Free'
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

// The message line under a form. The wrapper is always on the page, so screen readers announce what appears inside it.
function NoticeLine({ notice }: { notice: Notice }) {
  return (
    <div className="admin-notice-slot" aria-live="polite">
      {notice !== null && <p className={`admin-notice is-${notice.kind}`}>{notice.text}</p>}
    </div>
  )
}

function Admin({ onChanged }: AdminProps) {
  const [movies, setMovies] = useState<Movie[] | null>(null)
  const [premieres, setPremieres] = useState<Premiere[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  // Adding one to this number re-runs the loading effect below, which is how the lists refresh after a change.
  const [version, setVersion] = useState(0)
  // True while a request is in flight, so a double click cannot send the same request twice.
  const [busy, setBusy] = useState(false)

  // Add-a-movie form. Form fields are kept as text and turned into numbers when the form is sent.
  const [title, setTitle] = useState('')
  const [length, setLength] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [movieNotice, setMovieNotice] = useState<Notice>(null)

  // Schedule-a-premiere form.
  const [movieId, setMovieId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [price, setPrice] = useState('')
  const [scheduleNotice, setScheduleNotice] = useState<Notice>(null)

  // Cancel buttons. confirmId is the premiere that is showing "Yes, cancel it / Keep it".
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [cancelNotice, setCancelNotice] = useState<Notice>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Both lists load at the same time. The admin movie list needs an admin login, the premiere list is public.
        const [movieList, premiereList] = await Promise.all([
          api<Movie[]>('/api/admin/movies'),
          api<Premiere[]>('/api/premieres'),
        ])
        if (!cancelled) {
          setMovies(movieList)
          setPremieres(premiereList)
          setLoadFailed(false)
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [version])

  function reload() {
    setVersion((v) => v + 1)
  }

  async function handleAddMovie(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMovieNotice(null)
    const cleanTitle = title.trim()
    const cleanSynopsis = synopsis.trim()
    if (cleanTitle === '') {
      setMovieNotice({ kind: 'error', text: 'Enter a title.' })
      return
    }
    setBusy(true)
    try {
      const created = await api<{ id: number; title: string }>(
        '/api/admin/movies',
        postJson({
          title: cleanTitle,
          movie_length: Number(length),
          // An empty box means "no synopsis", which the API stores as null.
          synopsis: cleanSynopsis === '' ? null : cleanSynopsis,
        }),
      )
      setTitle('')
      setLength('')
      setSynopsis('')
      // Pick the new movie in the schedule form, so the next step is just a time and a price.
      setMovieId(String(created.id))
      setMovieNotice({ kind: 'ok', text: `Added ${created.title}. It is chosen below, ready to schedule.` })
      reload()
    } catch (err) {
      setMovieNotice({ kind: 'error', text: messageFor(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleSchedule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setScheduleNotice(null)
    // A datetime-local box gives text like "2026-11-05T19:00" with no zone. new Date() reads it as the browser's local time.
    const start = new Date(startsAt)
    // Money is stored as whole cents, so $19.99 becomes 1999. Math.round fixes float noise like 19.989999.
    const cents = Math.round(Number(price) * 100)
    if (movieId === '') {
      setScheduleNotice({ kind: 'error', text: 'Choose a movie.' })
      return
    }
    if (Number.isNaN(start.getTime())) {
      setScheduleNotice({ kind: 'error', text: 'Pick a start date and time.' })
      return
    }
    if (price.trim() === '' || !Number.isFinite(cents) || cents < 0) {
      setScheduleNotice({ kind: 'error', text: 'Enter a price of $0 or more.' })
      return
    }
    setBusy(true)
    try {
      await api<{ id: number }>(
        '/api/admin/premieres',
        postJson({
          movie_id: Number(movieId),
          // toISOString() gives UTC with a Z on the end. The API refuses a time that has no zone.
          starts_at: start.toISOString(),
          display_time_zone: BROWSER_ZONE,
          price_cents: cents,
        }),
      )
      const chosen = movies?.find((m) => m.id === Number(movieId))
      setStartsAt('')
      setPrice('')
      setScheduleNotice({ kind: 'ok', text: `Scheduled ${chosen?.title ?? 'the movie'} for ${formatWhen(start)}.` })
      reload()
      onChanged?.()
    } catch (err) {
      setScheduleNotice({ kind: 'error', text: messageFor(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel(p: Premiere) {
    setBusy(true)
    setCancelNotice(null)
    try {
      await api<{ id: number; cancelled: boolean }>(`/api/admin/premieres/${p.id}/cancel`, { method: 'POST' })
      setCancelNotice({ kind: 'ok', text: `Cancelled ${p.title}. It is off the catalog.` })
      reload()
      onChanged?.()
    } catch (err) {
      setCancelNotice({ kind: 'error', text: messageFor(err) })
    } finally {
      setConfirmId(null)
      setBusy(false)
    }
  }

  return (
    <section className="admin" aria-labelledby="admin-title">
      <header className="admin-head">
        <h2 id="admin-title">Admin</h2>
        <p>Only admin accounts see this. Viewers never do.</p>
      </header>

      {loadFailed && (
        <p className="admin-notice is-error" role="alert">
          Could not load the admin lists. Reload the page.
        </p>
      )}

      <div className="admin-grid">
        <div className="admin-col">
          <form className="admin-card" onSubmit={handleAddMovie} aria-labelledby="admin-add-title">
            <h3 id="admin-add-title">Add a movie</h3>
            <div className="admin-field">
              <label htmlFor="movie-title">Title</label>
              <input
                id="movie-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                autoComplete="off"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="movie-length">Length in minutes</label>
              <input
                id="movie-length"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="movie-synopsis">Synopsis (optional)</label>
              <textarea id="movie-synopsis" rows={3} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
            </div>
            <button type="submit" disabled={busy}>
              Add movie
            </button>
            <NoticeLine notice={movieNotice} />
          </form>

          <form className="admin-card" onSubmit={handleSchedule} aria-labelledby="admin-schedule-title">
            <h3 id="admin-schedule-title">Schedule a premiere</h3>
            <div className="admin-field">
              <label htmlFor="premiere-movie">Movie</label>
              <select id="premiere-movie" value={movieId} onChange={(e) => setMovieId(e.target.value)} required>
                <option value="">Choose a movie</option>
                {(movies ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="premiere-start">Starts at</label>
              <input
                id="premiere-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                aria-describedby="premiere-start-hint"
              />
              <small id="premiere-start-hint">Your time zone: {BROWSER_ZONE}</small>
            </div>
            <div className="admin-field">
              <label htmlFor="premiere-price">Ticket price in dollars</label>
              <input
                id="premiere-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="19.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                aria-describedby="premiere-price-hint"
              />
              <small id="premiere-price-hint">Use 0 for a free premiere. Viewers can watch for 7 days after the start.</small>
            </div>
            <button type="submit" disabled={busy}>
              Schedule premiere
            </button>
            <NoticeLine notice={scheduleNotice} />
          </form>
        </div>

        <div className="admin-col">
          <section className="admin-card" aria-labelledby="admin-premieres-title">
            <h3 id="admin-premieres-title">Premieres on the catalog</h3>
            {premieres === null ? (
              <p className="admin-empty">Loading...</p>
            ) : premieres.length === 0 ? (
              <p className="admin-empty">Nothing is scheduled. Use the form to schedule a premiere.</p>
            ) : (
              <ul className="admin-list">
                {premieres.map((p) => (
                  <li className="admin-row" key={p.id}>
                    <div className="admin-row-info">
                      <strong>{p.title}</strong>
                      <span className={`admin-state is-${p.state.toLowerCase()}`}>
                        {p.state === 'LIVE' ? 'Live now' : 'Upcoming'}
                      </span>
                      <span className="admin-meta">Starts {formatWhen(new Date(p.starts_at))}</span>
                      <span className="admin-meta">
                        Ticket {money(p.price_cents, p.currency)}, viewing ends {formatWhen(new Date(p.window_ends_at))}
                      </span>
                    </div>
                    {confirmId === p.id ? (
                      <div className="admin-confirm" role="group" aria-label={`Confirm cancelling ${p.title}`}>
                        <button type="button" className="admin-danger" disabled={busy} onClick={() => handleCancel(p)}>
                          Yes, cancel it
                        </button>
                        <button type="button" className="admin-quiet" disabled={busy} onClick={() => setConfirmId(null)}>
                          Keep it
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="admin-quiet"
                        disabled={busy}
                        aria-label={`Cancel premiere: ${p.title}`}
                        onClick={() => {
                          setCancelNotice(null)
                          setConfirmId(p.id)
                        }}
                      >
                        Cancel premiere
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <NoticeLine notice={cancelNotice} />
          </section>

          <section className="admin-card" aria-labelledby="admin-movies-title">
            <h3 id="admin-movies-title">Movies</h3>
            {movies === null ? (
              <p className="admin-empty">Loading...</p>
            ) : movies.length === 0 ? (
              <p className="admin-empty">No movies yet. Add the first one.</p>
            ) : (
              <ul className="admin-list is-compact">
                {movies.map((m) => (
                  <li className="admin-row" key={m.id}>
                    <strong>{m.title}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

export default Admin