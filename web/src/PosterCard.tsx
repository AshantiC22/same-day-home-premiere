import type { Premiere } from './types'
import { plateLabel } from './showtime'

// Placeholder poster art: a gradient per card until real poster images exist.
const posterArt = [
  'linear-gradient(160deg, #36505f 0%, #1a2a35 45%, #6b4a30 100%)',
  'linear-gradient(160deg, #5a1218 0%, #1c0a0d 70%, #07090d 100%)',
  'linear-gradient(160deg, #4a5240 0%, #22281f 60%, #0a0d0b 100%)',
  'linear-gradient(160deg, #3a1c6e 0%, #1b1040 45%, #0a0a1f 100%)',
  'linear-gradient(160deg, #24533f 0%, #14281f 60%, #07100c 100%)',
  'linear-gradient(160deg, #1f3a4d 0%, #0f1d28 60%, #060c11 100%)',
  'linear-gradient(160deg, #6b1a1a 0%, #2a0d0d 60%, #090607 100%)',
]

type PosterCardProps = {
  title: string
  seed: number
  imageUrl?: string
  // Decides the words on the plate: "Live now", or the day and time it starts.
  state: Premiere['state']
  startsAt: string
  onClick: () => void
}

// A poster in a lobby case: the picture, and a small plate underneath that says when to see it.
function PosterCard({ title, seed, imageUrl, state, startsAt, onClick }: PosterCardProps) {
  const live = state === 'LIVE'

  return (
    <button type="button" className="poster" onClick={onClick}>
      <span
        className={imageUrl === undefined ? 'poster-art is-typeset' : 'poster-art'}
        style={{ background: posterArt[seed % posterArt.length] }}
      >
        {imageUrl !== undefined && (
          <img className="poster-img" src={imageUrl} alt={title} loading="lazy" />
        )}
        {imageUrl === undefined && <span className="poster-title">{title}</span>}
      </span>
      <span className={live ? 'poster-plate is-live' : 'poster-plate'}>
        {live && <span className="live-dot" aria-hidden="true" />}
        {plateLabel({ state, starts_at: startsAt })}
      </span>
    </button>
  )
}

export default PosterCard