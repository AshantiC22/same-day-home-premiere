import { useEffect, useState } from 'react'
import type { Premiere } from './types'
import { api } from './api'

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
    <ul>
      {premieres.map((p) => (
        <li key={p.id}>
          <button type="button" onClick={() => onSelect(p.id)}>
            {p.title}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default Catalog