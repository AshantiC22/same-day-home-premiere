export type User = {
  id: number
  email: string
  role: 'user' | 'admin'
}

export type Premiere = {
  id: number
  title: string
  synopsis: string | null
  starts_at: string
  window_ends_at: string
  price_cents: number
  currency: string
  state: 'UPCOMING' | 'LIVE'
}