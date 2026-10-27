import { useEffect, useState } from 'react'
import { api } from './api'
import type { Movie } from './types'

function Admin() {
  const [movies, setMovies] = useState<Movie[]>([])

  useEffect(() => {
    api<Movie[]>('/api/admin/movies').then(setMovies)
  }, [])

  return (
    <div>
      <h2>Admin</h2>
      <h3>Movies</h3>
      <ul>
        {movies.map((m) => (
          <li key={m.id}>{m.title}</li>
        ))}
      </ul>
    </div>
  )
}

export default Admin