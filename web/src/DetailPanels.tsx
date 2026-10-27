import { useState } from 'react'
import type { MovieInfo } from './movieInfo'
import { backdropFor, posterFor } from './posters'

// The tab screens for the movie page. PremiereDetail.tsx picks which one shows.
// Each one handles a movie that has no researched info yet.

type PanelProps = {
  title: string
  synopsis: string | null
  info: MovieInfo | undefined
}

function Empty({ heading, text }: { heading: string; text: string }) {
  return (
    <div className="empty">
      <strong>{heading}</strong>
      {text}
    </div>
  )
}

function youtubeSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

// Pictures follow a naming rule, so adding one needs no code change:
//   web/public/people/firstname-lastname.png  -> cast photos
//   web/public/similar/movie-title.png        -> posters for similar movies
// Accents are dropped and spaces become dashes (Yū Aoi -> yu-aoi.png).
// A missing file just keeps the initials (or year) tile.
// TODO: replace with photo_url columns once cast and movies live in the database.
function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type ArtTileProps = {
  className: string
  src: string
  label: string
  background: string
}

function ArtTile({ className, src, label, background }: ArtTileProps) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={className} style={{ background }} aria-hidden="true">
      {label}
      {!failed && <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />}
    </span>
  )
}

function initials(name: string): string {
  const parts = name.split(' ').filter((part) => part !== '')
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (first === undefined || last === undefined) {
    return '?'
  }
  return parts.length === 1 ? first.charAt(0) : first.charAt(0) + last.charAt(0)
}

// Placeholder tile colors until we have real photos.
const tileArt = [
  'linear-gradient(160deg, #5a4636, #161a1f)',
  'linear-gradient(160deg, #3b4a52, #12171b)',
  'linear-gradient(160deg, #4a3a45, #15171d)',
  'linear-gradient(160deg, #2f4a45, #121a19)',
  'linear-gradient(160deg, #4d4540, #15181b)',
]

export function OverviewPanel({ title, synopsis, info }: PanelProps) {
  if (info === undefined) {
    return (
      <>
        <h2 className="detail-h2">About {title}</h2>
        <p className="story">{synopsis ?? 'No description yet.'}</p>
        <Empty heading="More details are coming" text="Cast, crew and facts for this movie have not been added yet." />
      </>
    )
  }

  return (
    <>
      <section className="detail-section">
        <h2 className="detail-h2">Storyline</h2>
        <div className="story">
          {info.overview.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-h2">Details</h2>
        <dl className="facts-grid">
          <div>
            <dt>Director</dt>
            <dd>{info.director}</dd>
          </div>
          <div>
            <dt>Written by</dt>
            <dd>{info.writers}</dd>
          </div>
          <div>
            <dt>Released</dt>
            <dd>
              {info.released.map((line) => (
                <span key={line} className="line">
                  {line}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd>{info.runtime}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>
              {info.rating}
              <span className="line subtle">{info.ratingNote}</span>
            </dd>
          </div>
          <div>
            <dt>Genres</dt>
            <dd>{info.genres.join(', ')}</dd>
          </div>
          <div>
            <dt>Studio</dt>
            <dd>{info.studio}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{info.country}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{info.language}</dd>
          </div>
        </dl>
      </section>

      <section className="detail-section">
        <h2 className="detail-h2">Did you know?</h2>
        <ul className="fact-list">
          {info.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <details className="sources">
        <summary>Where this info comes from</summary>
        <ul>
          {info.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
        <p>Scores change over time. These were checked in October 2026.</p>
      </details>
    </>
  )
}

export function TrailersPanel({ title, info }: PanelProps) {
  // TODO: host real trailers (trailer_url column + our own player). Until then
  // each card opens a YouTube search in a new tab.
  if (info === undefined) {
    return (
      <>
        <h2 className="detail-h2">Trailers &amp; Clips</h2>
        <a
          className="btn btn-outline"
          href={youtubeSearch(`${title} official trailer`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Search YouTube for the trailer
        </a>
      </>
    )
  }

  return (
    <>
      <h2 className="detail-h2">Trailers &amp; Clips</h2>
      <p className="detail-sub">These open YouTube in a new tab. Trailers hosted here are coming later.</p>
      <ul className="trailers">
        {info.trailers.map((trailer) => (
          <li key={trailer.title}>
            <a className="trailer" href={youtubeSearch(trailer.query)} target="_blank" rel="noopener noreferrer">
              <span className="trailer-art" aria-hidden="true">
                <span className="trailer-play">▶</span>
              </span>
              <strong>{trailer.title}</strong>
              <small>Opens YouTube</small>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

export function CastPanel({ info }: PanelProps) {
  if (info === undefined) {
    return (
      <>
        <h2 className="detail-h2">Cast &amp; Crew</h2>
        <Empty heading="Cast and crew are coming" text="We have not added them for this movie yet." />
      </>
    )
  }

  return (
    <>
      <section className="detail-section">
        <h2 className="detail-h2">Cast</h2>
        {info.castNote !== null && <p className="detail-sub">{info.castNote}</p>}
        <ul className="cast">
          {info.cast.map((person, i) => (
            <li key={person.name}>
              <ArtTile
                className="cast-art"
                src={`/people/${slug(person.name)}.png`}
                label={initials(person.name)}
                background={tileArt[i % tileArt.length]}
              />
              <strong>{person.name}</strong>
              <span>as {person.role}</span>
              {person.dub !== undefined && <span className="cast-dub">English: {person.dub}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h2 className="detail-h2">Crew</h2>
        <dl className="crew">
          {info.crew.map((credit) => (
            <div key={credit.job}>
              <dt>{credit.job}</dt>
              <dd>{credit.names}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

export function PhotosPanel({ title }: PanelProps) {
  // TODO: a real gallery needs a movie_images table. For now this shows the
  // poster and backdrop we already have.
  const poster = posterFor(title)
  const backdrop = backdropFor(title)

  if (poster === undefined && backdrop === undefined) {
    return (
      <>
        <h2 className="detail-h2">Photos</h2>
        <Empty heading="No photos yet" text="Posters and stills for this movie have not been added." />
      </>
    )
  }

  return (
    <>
      <h2 className="detail-h2">Photos</h2>
      <ul className="photos">
        {backdrop !== undefined && (
          <li className="photo-wide">
            <figure>
              <img src={backdrop} alt={`Still from ${title}`} loading="lazy" />
              <figcaption>Still</figcaption>
            </figure>
          </li>
        )}
        {poster !== undefined && (
          <li>
            <figure>
              <img src={poster} alt={`${title} poster`} loading="lazy" />
              <figcaption>Poster</figcaption>
            </figure>
          </li>
        )}
      </ul>
    </>
  )
}

type ReviewsProps = PanelProps & {
  notify: (message: string) => void
}

export function ReviewsPanel({ info, notify }: ReviewsProps) {
  return (
    <>
      {info === undefined ? (
        <>
          <h2 className="detail-h2">Reviews</h2>
          <Empty heading="No scores yet" text="Critic and audience scores have not been added for this movie." />
        </>
      ) : (
        <>
          <section className="detail-section">
            <h2 className="detail-h2">Scores</h2>
            <ul className="scores">
              {info.scores.map((score) => (
                <li key={score.source} className="score">
                  <span className="score-value">{score.value}</span>
                  <span className="score-source">{score.source}</span>
                  <span className="score-note">{score.note}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="detail-section">
            <h2 className="detail-h2">What critics said</h2>
            <ul className="fact-list">
              {info.reception.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="detail-section">
            <h2 className="detail-h2">Awards and festivals</h2>
            <ul className="fact-list">
              {info.awards.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="detail-section">
        <h2 className="detail-h2">Member reviews</h2>
        <Empty heading="No member reviews yet" text="Reviews from people who watched at home will show up here." />
        <button type="button" className="btn btn-outline review-btn" onClick={() => notify('Member reviews are coming soon.')}>
          Write a review
        </button>
      </section>
    </>
  )
}

export function SimilarPanel({ info }: PanelProps) {
  if (info === undefined) {
    return (
      <>
        <h2 className="detail-h2">Similar Movies</h2>
        <Empty heading="Suggestions are coming" text="We have not picked similar movies for this one yet." />
      </>
    )
  }

  return (
    <>
      <h2 className="detail-h2">Similar Movies</h2>
      <p className="detail-sub">Picked by hand for the same mood, style or filmmakers.</p>
      <ul className="similar-grid">
        {info.similar.map((movie, i) => (
          <li key={movie.title}>
            <article className="similar-card">
              <ArtTile
                className="similar-art"
                src={`/similar/${slug(movie.title)}.png`}
                label={String(movie.year)}
                background={tileArt[i % tileArt.length]}
              />
              <h3>{movie.title}</h3>
              <p className="similar-meta">
                {movie.kind} • {movie.by}
              </p>
              <p className="similar-why">{movie.why}</p>
              <a
                className="text-link"
                href={youtubeSearch(`${movie.title} ${movie.year} trailer`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch the trailer
                <span className="sr-only"> for {movie.title} (opens in a new tab)</span>
              </a>
            </article>
          </li>
        ))}
      </ul>
    </>
  )
}