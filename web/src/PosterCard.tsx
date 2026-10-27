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
  onClick: () => void
}

function PosterCard({ title, seed, imageUrl, onClick }: PosterCardProps) {
  return (
    <button
      type="button"
      className="poster"
      onClick={onClick}
      style={{ background: posterArt[seed % posterArt.length] }}
    >
      {imageUrl !== undefined && (
        <img className="poster-img" src={imageUrl} alt={title} loading="lazy" />
      )}
      <span className="poster-badge">Same day</span>
      {imageUrl === undefined && <span className="poster-title">{title}</span>}
    </button>
  )
}

export default PosterCard