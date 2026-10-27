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
    return <p>Loading...</p>
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
  onClick={() => onSelect(p.id)}
/>
          </li>
        ))}
      </ul>
    </>
  )
}

export default Catalog