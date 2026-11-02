import type { Premiere } from './types'

const DAY_MS = 86_400_000

// The words on the little plate under a poster: "Live now", or the day and time of an upcoming premiere.
export function plateLabel(p: Pick<Premiere, 'state' | 'starts_at'>): string {
  if (p.state === 'LIVE') {
    return 'Live now'
  }
  const start = new Date(p.starts_at)
  const time = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  // Inside the next week a weekday is enough. Further out, the date is clearer.
  if (start.getTime() - Date.now() < 6 * DAY_MS) {
    return `${start.toLocaleDateString([], { weekday: 'short' })} ${time}`
  }
  return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

// How many days the viewer has after the premiere starts.
function windowDays(p: Premiere): number {
  const ms = new Date(p.window_ends_at).getTime() - new Date(p.starts_at).getTime()
  return Math.round(ms / DAY_MS)
}

// The printed boxes on the ticket.
// The seat is the one the viewer picked at sign up, if they picked one.
export function ticketFields(p: Premiere, seat: string | null = null): { label: string; value: string }[] {
  const start = new Date(p.starts_at)
  const days = windowDays(p)
  return [
    { label: 'Date', value: start.toLocaleDateString([], { month: 'short', day: 'numeric' }) },
    {
      label: 'Time',
      value: p.state === 'LIVE' ? 'Now showing' : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    },
    { label: 'Window', value: days >= 1 ? `${days} ${days === 1 ? 'day' : 'days'}` : 'Limited' },
    { label: 'Seat', value: seat ?? 'Your couch' },
  ]
}