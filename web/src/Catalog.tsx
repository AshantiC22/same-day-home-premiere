import { useEffect, useState } from 'react'
import type { Premiere } from './types'
import { api } from './api'
import PosterCard from './PosterCard'
import { posterFor } from './posters'

type CatalogProps = {
  onSelect: (id: number) => void
}

function Catalog({ onSelect }: CatalogProps) {
  const [premieres, setPremieres] = useState<Premiere[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api<Premiere[]>('/api/premieres')
        if (!cancelled) {
          setPremieres(data)
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
  }, [])

  if (failed) {
    return <p>Could not load the catalog. Try again.</p>
  }
  if (premieres === null) {
    // Five empty posters with a light sweeping across them, so the row is already the right shape when the real ones arrive.
    return (
      <>
        <h2 className="row-title">
          Same Day Premieres <span aria-hidden="true">›</span>
        </h2>
        <ul className="poster-row" aria-busy="true" aria-label="Loading premieres">
          {[0, 1, 2, 3, 4].map((n) => (
            <li key={n}>
              <span className="poster-skeleton" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </>
    )
  }
  if (premieres.length === 0) {
    return <p>No premieres scheduled yet.</p>
  }

  return (
    <>
      <h2 className="row-title">
        Same Day Premieres <span aria-hidden="true">›</span>
      </h2>
      <ul className="poster-row">
        {premieres.map((p) => (
          <li key={p.id}>
            <PosterCard
              title={p.title}
              seed={p.id}
              imageUrl={posterFor(p.title)}
              state={p.state}
              startsAt={p.starts_at}
              onClick={() => onSelect(p.id)}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

export default Catalog